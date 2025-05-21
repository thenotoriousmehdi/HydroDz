const express = require("express");
const fs = require("fs");
const cors = require("cors")
const app = express();

app.use(cors())
app.use(express.json());

function getLastEntriesByBarrageId(data) {
  const latestEntries = {};

  data.forEach(entry => {
    if (!entry.valeurs || !entry.valeurs.barrageId || !entry.valeurs.timestamp) {
      return; 
    }
    const id = entry.valeurs.barrageId;
    const currentTimestamp = new Date(entry.valeurs.timestamp);

    if (!latestEntries[id] || new Date(latestEntries[id].valeurs.timestamp) < currentTimestamp) {
      latestEntries[id] = entry;
    }
  });

  return Object.values(latestEntries);
}
app.get("/data", (req, res) => {
  const data = fs.existsSync("../consumer/db.json")
    ? JSON.parse(fs.readFileSync("../consumer/db.json"))
    : [];
const latestByBarrage = getLastEntriesByBarrageId(data);
  res.json(latestByBarrage);
});

app.listen(5100, '0.0.0.0',() => {
  console.log("📡 API sur http://localhost:/data");
});

//