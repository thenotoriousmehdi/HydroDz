// const express = require("express");
// const bodyParser = require("body-parser");
// const { Kafka } = require("kafkajs");

// // Module logger simple pour éviter de dépendre d'un module externe
// const logger = {
//   debug: (message) => console.debug(`[DEBUG] ${message}`),
//   info: (message) => console.info(`[INFO] ${message}`),
//   warn: (message) => console.warn(`[WARN] ${message}`),
//   error: (message) => console.error(`[ERROR] ${message}`)
// };

// // Configuration Kafka
// const kafka = new Kafka({
//   clientId: "filtrage",
//   brokers: ["localhost:9092"]
// });
// const producer = kafka.producer();
// const consumer = kafka.consumer({ groupId: 'sensor-processor' });

// // Interface de base pour tous les filtres
// class Filter {
//   constructor(name) {
//     this.name = name;
//   }

//   process(data) {
//     logger.debug(`Filtre ${this.name}: traitement des données`);
//     return data;
//   }
// }

// // Filtre de validation: vérifie si les données sont dans une plage valide
// class ValidationFilter extends Filter {
//   constructor(config) {
//     super('Validation');
//     this.config = config;
//   }

//   process(data) {
//     logger.debug(`Filtre ${this.name}: validation des données`);
  
//     if (!data || !data.barrageId) {
//       logger.warn(`Données incomplètes reçues: ${JSON.stringify(data)}`);
//       return null;
//     }
  
//     const validatedData = { ...data };
  
//     if (validatedData.timestamp) {
//       const parsedDate = this.parseFrenchTimestamp
//         ? this.parseFrenchTimestamp(validatedData.timestamp)
//         : null;
  
//       if (parsedDate) {
//         validatedData.timestamp = parsedDate.toISOString();
//       } 
//     } else {
//       validatedData.timestamp = new Date().toISOString();
//     }
  
//     validatedData.sensorValidations = {};
//     validatedData.validSensors = [];
//     validatedData.invalidSensors = [];
//     validatedData.isValid = false;
  
//     const min = (data.min !== undefined) ? data.min : this.config.defaultSensor.min;
//     const max = (data.max !== undefined) ? data.max : this.config.defaultSensor.max;
  
//     const sensorKeys = ['capteur1', 'capteur2', 'capteur3', 'capteur4', 'capteurSecours'];
//     const sensorValues = {};
  
//     for (const sensorKey of sensorKeys) {
//       if (data[sensorKey] !== undefined) {
//         const sensorConfig = this.config.sensors?.[sensorKey] || this.config.defaultSensor;
//         const value = data[sensorKey];
//         sensorValues[sensorKey] = value;
  
//         if (value < min || value > max) {
//           logger.warn(`Valeur hors plage pour ${sensorKey}: ${value} [min: ${min}, max: ${max}]`);
//           validatedData.sensorValidations[sensorKey] = {
//             valid: false,
//             value,
//             reason: "out_of_range",
//           };
//           validatedData.invalidSensors.push(sensorKey);
//         } else {
//           validatedData.sensorValidations[sensorKey] = {
//             valid: true,
//             value,
//             convertedValue: value * (sensorConfig.conversionFactor || 1),
//           };
//           validatedData.validSensors.push(sensorKey);
//         }
//       }
//     }
  
//     if (validatedData.validSensors.length === 0) {
//       logger.warn("Tous les capteurs sont invalides ou absents");
//       return null;
//     }
  
//     // Calcul de la différence max absolue entre capteurs valides
//     const validValues = validatedData.validSensors.map(key => sensorValues[key]);
//     const maxDiff = Math.max(...validValues) - Math.min(...validValues);
  
//     // Condition d'acceptation : maxDiff <= 10
//     if (maxDiff > 10) {
//       logger.warn(`Divergence trop importante entre capteurs : différence max ${maxDiff} > 10`);
//       validatedData.isValid = false;
//       validatedData.validationMethod = "difference_too_high";
//       logger.warn(`Données rejetées: ${validatedData.validationMethod}`);
//       return null;
//     }
  
//     // Sinon, on accepte
//     validatedData.isValid = true;
//     validatedData.validationMethod = "difference_within_limit";
  
//     return validatedData;
//   }
  
// }

// // Filtre de redondance: compare les valeurs de capteurs redondants
// class RedundancyFilter extends Filter {
//   constructor() {
//     super('Redundance');
//   }

//   process(data) {
//     logger.debug(`Filtre ${this.name}: traitement de la redondance`);

//     if (!data || !data.isValid) return null;

//     const redundantData = { ...data };
//     const validSensorValues = data.validSensors.map(key => {
//       return {
//         key: key,
//         value: data.sensorValidations[key].convertedValue || data.sensorValidations[key].value
//       };
//     });

//     // Calcul de la valeur de consensus basée sur les capteurs valides
//     if (validSensorValues.length > 0) {
//       // Classement des valeurs pour utiliser la médiane
//       const sortedValues = [...validSensorValues].sort((a, b) => a.value - b.value);
//       const middleIndex = Math.floor(sortedValues.length / 2);
      
//       // Pour un nombre pair de valeurs, la médiane est la moyenne des deux valeurs centrales
//       if (sortedValues.length % 2 === 0) {
//         redundantData.consensusValue = (sortedValues[middleIndex - 1].value + sortedValues[middleIndex].value) / 2;
//       } else {
//         redundantData.consensusValue = sortedValues[middleIndex].value;
//       }
      
//       // Calcul de la dispersion pour la confiance
//       const values = validSensorValues.map(sv => sv.value);
//       const avg = values.reduce((a, b) => a + b, 0) / values.length;
//       const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
//       const stdDeviation = Math.sqrt(variance);
//       const relativeStdDev = avg !== 0 ? stdDeviation / avg : 1;
      
//       // Plus la dispersion est faible, plus la confiance est élevée
//       redundantData.confidence = Math.max(0, Math.min(1, 1 - relativeStdDev));
      
//       // Considérer les capteurs principaux et le capteur de secours séparément
//       redundantData.sensorContributions = validSensorValues.map(sv => ({
//         sensor: sv.key,
//         value: sv.value,
//         weight: 1 / validSensorValues.length
//       }));
//     } else {
//       // Ce cas ne devrait pas se produire car ValidationFilter aurait déjà rejeté les données
//       return null;
//     }

//     return redundantData;
//   }
// }

// // Filtre de transformation: convertit les unités, applique des calculs
// class TransformationFilter extends Filter {
//   constructor(config) {
//     super('Transformation');
//     this.config = config;
//   }

//   process(data) {
//     logger.debug(`Filtre ${this.name}: transformation des données`);

//     if (!data) return null;

//     const transformedData = { ...data };

//     // Ajouter des métadonnées
//     transformedData.processedTimestamp = new Date().toISOString();
//     transformedData.processingLatency = new Date() - new Date(data.timestamp);

//     // Appliquer des transformations selon la configuration
//     const sensorConfig = this.config.sensors.general;
//     let engValue = data.consensusValue;

//     // Appliquer offset
//     if (sensorConfig.offset) {
//       engValue += sensorConfig.offset;
//     }

//     // Appliquer une transformation non-linéaire si définie
//     if (sensorConfig.transform === 'square') {
//       engValue = engValue * engValue;
//     } else if (sensorConfig.transform === 'sqrt') {
//       engValue = Math.sqrt(engValue);
//     } else if (sensorConfig.transform === 'log') {
//       engValue = Math.log(engValue);
//     }

//     transformedData.engineeringValue = {
//       name: sensorConfig.name,
//       value: engValue,
//       unit: sensorConfig.unit,
//       confidence: data.confidence
//     };

//     return transformedData;
//   }
// }

// // Filtre de lissage: applique un algorithme de lissage (moyenne mobile)
// class SmoothingFilter extends Filter {
//   constructor(windowSize = 5) {
//     super('Lissage');
//     this.windowSize = windowSize;
//     // Garder un historique par barrage
//     this.historyByBarrage = {};
//   }

//   process(data) {
//     logger.debug(`Filtre ${this.name}: lissage des données`);

//     if (!data || !data.barrageId) return null;

//     const smoothedData = { ...data };
//     const barrageId = data.barrageId;

//     // Initialiser l'historique pour ce barrage si nécessaire
//     if (!this.historyByBarrage[barrageId]) {
//       this.historyByBarrage[barrageId] = [];
//     }

//     // Ajouter la valeur actuelle à l'historique
//     this.historyByBarrage[barrageId].push({
//       timestamp: data.timestamp,
//       value: data.engineeringValue.value,
//       confidence: data.engineeringValue.confidence
//     });

//     // Limiter la taille de l'historique
//     if (this.historyByBarrage[barrageId].length > this.windowSize) {
//       this.historyByBarrage[barrageId].shift();
//     }

//     // Calculer la moyenne mobile pondérée par la confiance
//     let totalWeight = 0;
//     let weightedSum = 0;

//     for (const record of this.historyByBarrage[barrageId]) {
//       const weight = record.confidence || 0.5;
//       weightedSum += record.value * weight;
//       totalWeight += weight;
//     }

//     const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : data.engineeringValue.value;

//     smoothedData.smoothedValue = {
//       ...data.engineeringValue,
//       originalValue: data.engineeringValue.value,
//       smoothedValue: weightedAvg,
//       windowSize: this.historyByBarrage[barrageId].length
//     };

//     return smoothedData;
//   }
// }

// // Configuration des filtres
// const filtersConfig = {
//   validation: {
//     defaultSensor: {
//       min: 0,
//       max: 100,
//       conversionFactor: 1
//     },
//     sensors: {
//       'capteur1': { min: 0.1, max: 100, conversionFactor: 1.0 },
//       'capteur2': { min: 0.1, max: 100, conversionFactor: 1.0 },
//       'capteur3': { min: 0.1, max: 100, conversionFactor: 1.0 },
//       'capteur4': { min: 0.1, max: 100, conversionFactor: 1.0 },
//       'capteurSecours': { min: 0.1, max: 100, conversionFactor: 1.0 }
//     }
//   },
//   transformation: {
//     sensors: {
//       general: {
//         name: 'Niveau Barrage',
//         unit: 'm',
//         offset: 0,
//         transform: null // Pas de transformation non-linéaire
//       }
//     }
//   }
// };

// // Classe qui implémente le Pattern Pipe-Filter complet
// class SensorDataPipeline {
//   constructor() {
//     // Créer les filtres
//     this.filters = [
//       new ValidationFilter(filtersConfig.validation),
//       new RedundancyFilter(),
//       new TransformationFilter(filtersConfig.transformation),
//       new SmoothingFilter(5)
//     ];

//     logger.info('Pipeline de traitement des données capteurs initialisé');
//   }

//   processData(data) {
//     logger.debug(`Traitement des données: ${JSON.stringify(data)}`);

//     // Appliquer successivement les filtres
//     let processedData = data;

//     for (const filter of this.filters) {
//       processedData = filter.process(processedData);
      
//       // Si un filtre retourne null, on arrête le traitement
//       if (!processedData) {
//         logger.warn(`Le filtre ${filter.name} a rejeté les données`);
//         return null;
//       }
//     }

//     return processedData;
//   }
// }

// // Créer l'instance du pipeline
// const pipeline = new SensorDataPipeline();

// // Application Express
// const app = express();
// app.use(bodyParser.json());

// // Endpoint pour filtrer et traiter les données
// app.post("/filtrer", async (req, res) => {
//   const data = req.body;

//   // Vérification basique de la requête
//   if (!data || typeof data !== 'object') {
//     return res.status(400).send("Format de données invalide");
//   }

//   // Traiter les données avec notre pipeline
//   const processedData = pipeline.processData(data);

//   if (!processedData) {
//     return res.status(400).json({
//       success: false,
//       message: "Données rejetées par le pipeline de traitement",
//       originalData: data,
//       reason: "La validation a échoué. Vérifiez les plages de valeurs et la cohérence des capteurs."
//     });
//   }

//   try {
//     // Envoyer les données traitées à Kafka
//     await producer.send({
//       topic: "barrage-data-processed",
//       messages: [{ value: JSON.stringify(processedData) }],
//     });

//     // Envoyer aussi les données brutes
//     await producer.send({
//       topic: "barrage-data-raw",
//       messages: [{ value: JSON.stringify(data) }],
//     });

//     res.json({
//       success: true,
//       message: "Données filtrées et envoyées à Kafka",
//       processedData: processedData
//     });
//   } catch (error) {
//     logger.error("Erreur lors de l'envoi à Kafka:", error);
//     res.status(500).send("Erreur lors de l'envoi des données");
//   }
// });

// // Ajouter un point de terminaison pour la surveillance
// app.get("/health", (req, res) => {
//   res.json({
//     status: "UP",
//     timestamp: new Date().toISOString(),
//     version: "1.0.0"
//   });
// });

// // Démarrer le serveur
// async function startServer() {
//   try {
//     await producer.connect();
//     app.listen(4000, () => {
//       console.log("🚀 Pipeline prêt sur http://localhost:4000");
//     });
//   } catch (error) {
//     logger.error("Erreur lors du démarrage du serveur:", error);
//     process.exit(1);
//   }
// }

// startServer();

// // Exporter pour les tests ou l'utilisation dans d'autres modules
// module.exports = {
//   app,
//   pipeline,
//   filters: {
//     ValidationFilter,
//     RedundancyFilter,
//     TransformationFilter,
//     SmoothingFilter
//   }
// };

const express = require("express");
const bodyParser = require("body-parser");
const { Kafka } = require("kafkajs");

const readRaw = require("./readRaw");
const crossValidate = require("./crossValidation");
const selectTrusted = require("./trustedValue");
const format = require("./formatAndSmooth");

const kafka = new Kafka({ clientId: "filtrage", brokers: ["localhost:9092"] });
const producer = kafka.producer();
const app = express();
app.use(bodyParser.json());

app.post("/filtrer", async (req, res) => {
  try {
    let data = readRaw(req.body);
    data = crossValidate(data);
    data = selectTrusted(data);
    const finalData = format(data);

    console.log("Données traitées:", finalData);
    res.send("✅ Données traitées et envoyées");
  } catch (error) {
    res.status(400).send("❌ Erreur de traitement : " + error.message);
  }
});

app.listen(4000, async () => {
  await producer.connect();
  console.log("🚀 Pipeline prêt sur http://localhost:4000");
});
