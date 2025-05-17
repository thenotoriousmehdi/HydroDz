module.exports = function selectTrusted(data) {
    if (data.valid.length === 0) {
      throw new Error("Aucune valeur valide");
    }
  
    const sum = data.valid.reduce((a, b) => a + b, 0);
    const trusted = sum / data.valid.length;
  
    return { ...data, trusted };
  };
  