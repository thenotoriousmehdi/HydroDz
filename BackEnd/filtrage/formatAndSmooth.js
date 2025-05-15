module.exports = function format(data) {
    return {
      barrageId: data.barrageId,
      wilaya: data.wilaya,
      timestamp: data.timestamp,
      valeur: parseFloat(data.trusted.toFixed(2)), // formatée
    };
  };
  