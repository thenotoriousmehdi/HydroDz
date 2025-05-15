const express = require("express");
const fs = require("fs");
const cors = require("cors")
const app = express();

app.use(cors())
app.use(express.json());


app.get("/data", (req, res) => {
  const data = fs.existsSync("../consumer/db.json")
    ? JSON.parse(fs.readFileSync("../consumer/db.json"))
    : [];
  res.json(data);
});

app.listen(5100, '0.0.0.0',() => {
  console.log("📡 API sur http://localhost:/data");
});
