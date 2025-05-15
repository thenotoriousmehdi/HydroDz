module.exports = function readRaw(data) {
    return {
      barrageId: data.barrageId,
      wilaya: data.wilaya,
      timestamp: data.timestamp,
      values: [data.capteur1, data.capteur2, data.capteur3, data.capteur4, data.capteurSecours],
      min: data.min,
      max: data.max
    };
  };
  