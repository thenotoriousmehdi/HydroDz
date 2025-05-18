

const express = require("express");
const bodyParser = require("body-parser");
const { Kafka } = require("kafkajs");
const fs = require("fs");
const path = require("path");

const app = express();

// 📁 Fichiers JSON
const lastValuesPath = path.join(__dirname, 'lastValues.json');
const derivesLogPath = path.join(__dirname, 'derives.json');

// 🔧 Seuils de détection de dérive
const seuilsVariation = {
  temperature: 20,
  pression: 20,
  niveau_eau: 20,
  humidite: 20,
};

// 📦 Middlewares
app.use(bodyParser.json());

// 📤 Charger les dernières valeurs
function loadLastValues() {
  if (!fs.existsSync(lastValuesPath)) return {};

  try {
    const content = fs.readFileSync(lastValuesPath, "utf-8").trim();
    if (content === "") return {}; // fichier vide
    return JSON.parse(content);
  } catch (err) {
    console.error("Erreur lors du chargement de lastValues.json:", err.message);
    return {};
  }
}

// 💾 Sauvegarder les dernières valeurs
function saveLastValues(data) {
  fs.writeFileSync(lastValuesPath, JSON.stringify(data, null, 2));
}

// 🧾 Journaliser une dérive détectée
function logDerive(newEntry) {
  const filePath = path.join(__dirname, 'derives.json');

  try {
    let derives = [];
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").trim();
      if (content !== "") {
        derives = JSON.parse(content);
      }
    }
    derives.push(newEntry);
    fs.writeFileSync(filePath, JSON.stringify(derives, null, 2));
  } catch (err) {
    console.error("Erreur lors de la lecture ou l’écriture de derives.json:", err.message);
  }
}



function median(values) {
  if (values.length === 0) return null;
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 !== 0
    ? values[mid]
    : (values[mid - 1] + values[mid]) / 2;
}

function removeOutliers(capteurs, attribut, seuil = 5) {
  const moy = capteurs.reduce((s, c) => s + c[attribut], 0) / capteurs.length;
  return capteurs.filter((c) => Math.abs(c[attribut] - moy) <= seuil);
}

function pipeFilter(data) {
  const { capteurs, min, max } = data;
  let lastValues = loadLastValues();

  let capteursFiltrés = capteurs.filter((capteur) => {
    const previous = lastValues[capteur.id];

    // Rejeter les valeurs négatives
    if (
      capteur.niveau_eau < 0 ||
      capteur.temperature < 0 ||
      capteur.pression < 0 ||
      capteur.humidite < 0
    ) {
      return false;
    }

    // Rejeter si dérive brutale
    if (previous) {
      for (let param in seuilsVariation) {
        const ecart = Math.abs(capteur[param] - previous[param]);
        if (ecart > seuilsVariation[param]) {
          logDerive({
            capteurId: capteur.id,
            parametre: param,
            ancienneValeur: previous[param],
            nouvelleValeur: capteur[param],
            ecart: ecart,
            seuil: seuilsVariation[param],
            timestamp: new Date().toISOString(),
          });
          return false;
        }
      }
    }

    // Sauvegarder les nouvelles valeurs
    lastValues[capteur.id] = {
      temperature: capteur.temperature,
      pression: capteur.pression,
      niveau_eau: capteur.niveau_eau,
      humidite: capteur.humidite,
    };

    return true;
  });

  //  Sauvegarde les dernières valeurs filtrées
  saveLastValues(lastValues);

  //  Trop peu de capteurs valides
  if (capteursFiltrés.length < 2) {
    return { status: "anomalie", message: "Moins de 2 capteurs valides", valeurs: null };
  }

  //  Validation croisée : retirer capteurs aberrants (basé sur niveau_eau)
  capteursFiltrés = removeOutliers(capteursFiltrés, 'niveau_eau', 3);

  // ⛔ Encore trop peu de capteurs après nettoyage
  if (capteursFiltrés.length < 2) {
    return { status: "anomalie", message: "Capteurs incohérents entre eux", valeurs: null };
  }

  // 📊 Calcul des médianes
  const moyenne = {
    temperature: median(capteursFiltrés.map(c => c.temperature)),
    pression: median(capteursFiltrés.map(c => c.pression)),
    niveau_eau: median(capteursFiltrés.map(c => c.niveau_eau)),
    humidite: median(capteursFiltrés.map(c => c.humidite)),
  };

  // 🎯 Calcul de l’indice de confiance
  const ecarts = capteursFiltrés.map(c => Math.abs(c.niveau_eau - moyenne.niveau_eau));
  const ecartMax = Math.max(...ecarts);
  const confiance = ecartMax < 0.2 ? "forte" : ecartMax < 0.5 ? "moyenne" : "faible";

  // 🟢 État du niveau
  let status = "normal";
  if(confiance === "faible") status = "warning";
  if (moyenne.niveau_eau < min) status = "niveau_bas";
  else if (moyenne.niveau_eau > max) status = "niveau_eleve";

  return {
    status,
    valeurs: {
      ...moyenne,
      confiance,
      timestamp: data.timestamp,
      barrageId: data.barrageId,
      wilaya: data.wilaya,
    },
  };
}

const kafka = new Kafka({ clientId: "filtrage", brokers: ["localhost:9092"] });
const producer = kafka.producer();
app.use(bodyParser.json());

app.post("/filtrer", async (req, res) => {
  try {
  //  console.log("Données reçues:", req.body);
   const result = pipeFilter(req.body);
    console.log("Données traitées:", result);
    await producer.send({
      topic: "barrage-data",
      messages: [{ value: JSON.stringify(result) }], // <- ici on envoie `result`
    });

    res.send("✅ Données traitées et envoyées"); // <- la réponse est envoyée après tout

  } catch (error) {
    res.status(400).send("❌ Erreur de traitement : " + error.message);
    console.error("Erreur de traitement:", error);
  }
});

app.listen(4000, async () => {
  await producer.connect();
  console.log("🚀 Pipeline prêt sur http://localhost:4000");
});



