const { DataTypes: DT, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Comparison extends Model {}

  Comparison.init({
    id: {
      type: DT.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true
    },
    firstImage: {
      type: DT.STRING,
      allowNull: false,
      unique: 'comparisonComposite'
    },
    secondImage: {
      type: DT.STRING,
      allowNull: false,
      unique: 'comparisonComposite'
    },
    distance: {
      type: DT.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    difference: {
      type: DT.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    isSimilar: {
      type: DT.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'comparison',
    timestamps: true,
    tableName: 'comparisons'
  });

  return Comparison;
};
