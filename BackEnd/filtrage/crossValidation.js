module.exports = function crossValidate(data) {
    const valid = data.values.filter(v => v >= data.min && v <= data.max);
    return { ...data, valid };
  };
  