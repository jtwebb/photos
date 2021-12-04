const { DataTypes: DT, Model } = require('sequelize');

module.exports = (sequelize) => {
  class BadImage extends Model {}

  BadImage.init({
    id: {
      type: DT.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true
    },
    sourcePath: {
      type: DT.STRING,
      allowNull: false,
      unique: true
    },
    error: {
      type: DT.TEXT
    }
  }, {
    sequelize,
    modelName: 'badImage',
    timestamps: true,
    tableName: 'badImages'
  });

  return BadImage;
};
