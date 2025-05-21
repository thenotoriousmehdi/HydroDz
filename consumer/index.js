const { Kafka } = require("kafkajs");
const fs = require("fs");

const kafka = new Kafka({ clientId: "consumer", brokers: ["localhost:9092"] });
const consumer = kafka.consumer({ groupId: "group1" });

const saveData = (data) => {
  const db = "./db.json";
  const content = fs.existsSync(db) ? JSON.parse(fs.readFileSync(db)) : [];
  content.push(data);
  fs.writeFileSync(db, JSON.stringify(content, null, 2));
};

async function start() {
  await consumer.connect();
  await consumer.subscribe({ topic: "barrage-data", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      console.log("Reçu:", data);
      saveData(data);
    },
  });
}

start();
