

const express = require("express");
const bodyParser = require("body-parser");
const { Kafka } = require("kafkajs");
const fs = require("fs");
const path = require("path");

const app = express();

//  Fichiers JSON
const lastValuesPath = path.join(__dirname, 'lastValues.json');
const derivesLogPath = path.join(__dirname, 'derives.json');

// 🔧 Seuils de détection de dérive
const seuilsVariation = {
  temperature: 20,
  pression: 20,
  niveau_eau: 20,
  humidite: 20,
};

//  Middlewares
app.use(bodyParser.json());

//  Charger les dernières valeurs
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


  // ON FILTRE LES CAPTEURS QUI DONNE DES VALEURS ILLOGIQUE (COMPARAISON AVEC LES DERNIERES VALEURS ET SEUILS)
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

  //  Validation croisée : retirer capteurs aberrants (SELON  NIVEAU_EAU )
  capteursFiltrés = removeOutliers(capteursFiltrés, 'niveau_eau', 3);

  //  Encore trop peu de capteurs après nettoyage
  if (capteursFiltrés.length < 2) {
    return { status: "anomalie", message: "Capteurs incohérents entre eux", valeurs: null };
  }

  // Calcul des médianes
  const moyenne = {
    temperature: median(capteursFiltrés.map(c => c.temperature)),
    pression: median(capteursFiltrés.map(c => c.pression)),
    niveau_eau: median(capteursFiltrés.map(c => c.niveau_eau)),
    humidite: median(capteursFiltrés.map(c => c.humidite)),
  };

  //  Calcul de l’indice de confiance
  const ecarts = capteursFiltrés.map(c => Math.abs(c.niveau_eau - moyenne.niveau_eau));
  const ecartMax = Math.max(...ecarts);
  const confiance = ecartMax < 0.2 ? "forte" : ecartMax < 0.5 ? "moyenne" : "faible";

  //  État du niveau
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




// Configuration du gestionnaire de files
class QueueManager {
  constructor() {
    // Files d'attente par priorité
    this.queues = {
      high: [],    // Alertes critiques (niveau_bas, niveau_eleve)
      medium: [],  // Warnings et états incertains
      low: []      // Données normales de routine
    };
    
    // Configuration
    this.config = {
      flushInterval: 5000,        // Intervalle de traitement des files (ms)
      maxRetries: 3,              // Nombre max de tentatives d'envoi
      persistPath: path.join(__dirname, 'queue_backup.json'),
      batchSize: {
        high: 1,    // Messages critiques envoyés immédiatement
        medium: 5,  // Messages de priorité moyenne groupés par 5
        low: 10     // Messages de routine groupés par 10
      }
    };
    
    // État du système
    this.status = {
      kafkaConnected: false,
      processingActive: false,
      lastFlushTime: null,
      stats: {
        processed: 0,
        failed: 0,
        retried: 0
      }
    };
    
    // Démarrer le traitement périodique
    this.startProcessing();
    
    // Restaurer les files persistées en cas de redémarrage
    this.restoreQueues();
  }
  
  // Ajouter un message dans la file appropriée
  enqueue(message) {
    // Déterminer la priorité en fonction du statut
    let priority = "low";
    
    if (message.status === "niveau_bas" || message.status === "niveau_eleve") {
      priority = "high";
    } else if (message.status === "warning" || message.valeurs?.confiance === "faible") {
      priority = "medium";
    }
    
    // Ajouter à la file appropriée avec metadata
    const queuedMessage = {
      data: message,
      metadata: {
        timestamp: new Date().toISOString(),
        attempts: 0,
        priority: priority,
        barrageId: message.valeurs?.barrageId || "unknown"
      }
    };
    
    this.queues[priority].push(queuedMessage);
    console.log(`Message mis en file: priorité ${priority}, barrage ${queuedMessage.metadata.barrageId}`);
    
    // Traitement immédiat pour les messages critiques
    if (priority === "high") {
      this.processQueue("high");
    }
    
    // Persistance en cas de messages critiques
    if (priority === "high" || priority === "medium") {
      this.persistQueues();
    }
    
    return queuedMessage.metadata;
  }
  
  // Traiter les files selon leur priorité
  async processQueue(priority) {
    if (!this.status.kafkaConnected || this.queues[priority].length === 0) {
      return;
    }
    
    try {
      // Extraire un lot de messages selon la configuration
      const batchSize = Math.min(this.config.batchSize[priority], this.queues[priority].length);
      const batch = this.queues[priority].splice(0, batchSize);
      
      // Préparation des messages pour Kafka
      const kafkaMessages = batch.map(item => ({
        value: JSON.stringify(item.data),
        headers: {
          priority: priority,
          attempts: String(item.metadata.attempts + 1),
          timestamp: item.metadata.timestamp
        }
      }));
      
      // Envoi à Kafka (implémentation à compléter)
      // await this.producer.send({
      //   topic: "barrage-data",
      //   messages: kafkaMessages
      // });
      
      // Mise à jour des statistiques
      this.status.stats.processed += batch.length;
      
    } catch (error) {
      console.error(`Erreur de traitement de la file ${priority}:`, error);
      
      // Réintégrer les messages non envoyés avec incrémentation des tentatives
      for (const message of batch) {
        message.metadata.attempts++;
        
        if (message.metadata.attempts < this.config.maxRetries) {
          // Remettre en file pour réessai
          this.queues[priority].unshift(message);
          this.status.stats.retried++;
        } else {
          // Journaliser l'échec définitif
          this.logFailedMessage(message);
          this.status.stats.failed++;
        }
      }
    }
  }
  
  // Démarrer le traitement périodique des files
  startProcessing() {
    setInterval(() => {
      if (!this.status.processingActive) {
        this.status.processingActive = true;
        
        // Traiter les files par ordre de priorité
        Promise.all([
          this.processQueue("high"),
          this.processQueue("medium"),
          this.processQueue("low")
        ]).finally(() => {
          this.status.processingActive = false;
          this.status.lastFlushTime = new Date().toISOString();
        });
      }
    }, this.config.flushInterval);
  }
  
  // Persister les files pour récupération en cas de redémarrage
  persistQueues() {
    try {
      // Sauvegarder uniquement les messages critiques et warnings
      const dataToSave = {
        high: this.queues.high,
        medium: this.queues.medium,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(this.config.persistPath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error("Erreur lors de la persistance des files:", error);
    }
  }
  
  // Restaurer les files depuis la sauvegarde
  restoreQueues() {
    try {
      if (fs.existsSync(this.config.persistPath)) {
        const data = JSON.parse(fs.readFileSync(this.config.persistPath, "utf-8"));
        
        // Restaurer les files de haute et moyenne priorité
        if (data.high) this.queues.high = data.high;
        if (data.medium) this.queues.medium = data.medium;
        
        console.log(`Files restaurées: ${this.queues.high.length} messages haute priorité, ${this.queues.medium.length} messages priorité moyenne`);
      }
    } catch (error) {
      console.error("Erreur lors de la restauration des files:", error);
    }
  }
  
  // Journaliser les messages définitivement échoués
  logFailedMessage(message) {
    try {
      const failedLogPath = path.join(__dirname, 'failed_messages.json');
      let failedMessages = [];
      
      if (fs.existsSync(failedLogPath)) {
        failedMessages = JSON.parse(fs.readFileSync(failedLogPath, "utf-8"));
      }
      
      failedMessages.push({
        message: message,
        errorTime: new Date().toISOString()
      });
      
      fs.writeFileSync(failedLogPath, JSON.stringify(failedMessages, null, 2));
    } catch (error) {
      console.error("Erreur lors de la journalisation du message échoué:", error);
    }
  }
  
  // Obtenir des statistiques sur l'état des files
  getStatus() {
    return {
      queuesLength: {
        high: this.queues.high.length,
        medium: this.queues.medium.length,
        low: this.queues.low.length
      },
      status: this.status,
      config: this.config
    };
  }
}




















const kafka = new Kafka({ clientId: "filtrage", brokers: ["localhost:9092"] });
const producer = kafka.producer();
app.use(bodyParser.json());

const saveData = (data) => {
  const db = "./db.json";
  const content = fs.existsSync(db) ? JSON.parse(fs.readFileSync(db)) : [];
  content.push(data);
  fs.writeFileSync(db, JSON.stringify(content, null, 2));
};

const queueManager = new QueueManager();




// Configurer la connexion Kafka
async function setupKafka() {
  try {
    await producer.connect();
    queueManager.status.kafkaConnected = true;
    console.log("✅ Connecté à Kafka");
  } catch (error) {
    console.error("❌ Erreur de connexion à Kafka:", error);
    queueManager.status.kafkaConnected = false;
    
    // Réessayer la connexion après un délai
    setTimeout(setupKafka, 5000);
  }
}

app.post("/filtrer", async (req, res) => {
  saveData(req.body);
  // try {
  // //  console.log("Données reçues:", req.body);
  //  const result = pipeFilter(req.body);
  //   console.log("Données traitées:", result);
  //   await producer.send({
  //     topic: "barrage-data",
  //     messages: [{ value: JSON.stringify(result) }], 
  //   });

  //   res.send("Données traitées et envoyées"); 

  // } catch (error) {
  //   res.status(400).send(" Erreur de traitement : " + error.message);
  //   console.error("Erreur de traitement:", error);
  // }
  try {
    // Pipeline de filtrage existant (votre code actuel)
    const result = pipeFilter(req.body);
    
    // Au lieu d'envoyer directement à Kafka, passer par le gestionnaire de files
    const queueStatus = queueManager.enqueue(result);
    
    res.json({
      status: "Données traitées et mises en file",
      priority: queueStatus.priority,
      timestamp: queueStatus.timestamp
    });
  } catch (error) {
    res.status(400).send("Erreur de traitement: " + error.message);
  }
});

// Endpoint pour vérifier l'état des files
app.get("/queue-status", (req, res) => {
  res.json(queueManager.getStatus());
});


app.listen(4000, async () => {
    await setupKafka();

  console.log("🚀 Pipeline prêt sur http://localhost:4000");
});
