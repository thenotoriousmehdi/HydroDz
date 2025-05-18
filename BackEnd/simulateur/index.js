const axios = require("axios");

// Choisis ici le mode : "valide" | "moins2valides" | "incoherent"
const mode = "valide"; //  modifie cette variable pour la démo

const barrages = [
  { id: "DAM001", wilaya: "Alger", min: 0, max: 100 },
  { id: "DAM002", wilaya: "Blida", min: 0, max: 100 },
  { id: "DAM003", wilaya: "Tizi Ouzou", min: 1, max: 100 },
  { id: "DAM004", wilaya: "Oran", min: 1, max: 100 },
  { id: "DAM005", wilaya: "Annaba", min: 2, max: 100 },
];

const capteursParBarrage = {
  DAM001: ["c1", "c2", "c3", "c4"],
  DAM002: ["c5", "c6", "c7", "c8"],
  DAM003: ["c9", "c10", "c11", "c12"],
  DAM004: ["c13", "c14", "c15", "c16"],
  DAM005: ["c17", "c18", "c19", "c20"],
};

// Fonction pour générer les capteurs en fonction du mode
function generateCapteurs(mode, capteurIds) {
  switch (mode) {
    case "valide":
      return capteurIds.map((id) => ({
        id,
        temperature: +(20 + Math.random() * 2).toFixed(2),
        pression: +(70 + Math.random() * 2).toFixed(2),
        niveau_eau: +(15 + Math.random() * 2).toFixed(2),
        humidite: +(50 + Math.random() * 2).toFixed(2),
      }));

    case "moins2valides":
      return capteurIds.map((id, index) => {
        if (index === 1) {
          // un seul capteur valide
          return {
            id,
            temperature: 22.1,
            pression: 68.9,
            niveau_eau: 16.5,
            humidite: 58.2,
          };
        } else {
          // les autres rejetés (valeurs aberrantes)
          return {
            id,
            temperature: -999,
            pression: -100,
            niveau_eau: -1,
            humidite: -10,
          };
        }
      });

    case "incoherent":
      return capteurIds.map((id, index) => ({
        id,
        temperature: +(20 + Math.random()).toFixed(2),
        pression: +(65 + Math.random()).toFixed(2),
        niveau_eau: index === 2
          ? +(15 + Math.random() * 10).toFixed(2) 
          : +(5 + Math.random()).toFixed(2),
        humidite: +(55 + Math.random()).toFixed(2),
      }));

    default:
      throw new Error("Mode invalide");
  }
}

setInterval(() => {
  const barrage = barrages[Math.floor(Math.random() * barrages.length)];
  const capteurIds = capteursParBarrage[barrage.id];

  const capteurs = generateCapteurs(mode, capteurIds);

  const data = {
    barrageId: barrage.id,
    wilaya: barrage.wilaya,
    min: barrage.min,
    max: barrage.max,
    capteurs,
    timestamp: new Date().toISOString(),
  };

  axios
    .post("http://localhost:4000/filtrer", data)
    .then(() => console.log("✅ Donnée envoyée:", mode, data))
    .catch((err) => console.error("❌ Erreur:", err.message));
}, 5100);
