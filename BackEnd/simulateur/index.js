const axios = require("axios");

setInterval(() => {
    const barrage = barrages[Math.floor(Math.random() * barrages.length)];

  const data = {
    barrageId: barrage.id,
    wilaya: barrage.wilaya,
    min: barrage.min,
    max: barrage.max, 
    capteur1: +(Math.random() * 10).toFixed(2),
    capteur2: +(Math.random() * 10).toFixed(2),
    capteur3: +(Math.random() * 10).toFixed(2),
    capteur4: +(Math.random() * 10).toFixed(2),
    capteurSecours: +(Math.random() * 10).toFixed(2),
    timestamp: new Date().toLocaleString("fr-FR")
  };

  axios.post("http://localhost:4000/filtrer", data)
    .then(() => console.log("✅ Donnée envoyée:", data))
    .catch(err => console.error("❌ Erreur:", err.message));
}, 5100);



const barrages = [
  { id: "DAM001", wilaya: "Alger", min: 0, max: 20 },
  { id: "DAM002", wilaya: "Blida", min: 0, max: 17 },
  { id: "DAM003", wilaya: "Tizi Ouzou", min: 1, max: 24 },
  { id: "DAM004", wilaya: "Oran", min: 1, max: 22 },
  { id: "DAM005", wilaya: "Annaba", min: 2, max: 26 },
];
