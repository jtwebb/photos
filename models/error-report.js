const { DataTypes: DT, Model } = require('sequelize');

module.exports = (sequelize) => {
  class ErrorReport extends Model {}

  ErrorReport.init({
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
    filename: {
      type: DT.STRING
    },
    functionName: {
      type: DT.STRING
    },
    lineNumber: {
      type: DT.INTEGER
    },
    columnNumber: {
      type: DT.INTEGER
    },
    message: {
      type: DT.STRING
    },
    code: {
      type: DT.STRING
    },
    stack: {
      type: DT.TEXT
    }
  }, {
    sequelize,
    modelName: 'errorReport',
    timestamps: true,
    tableName: 'errorReports'
  });

  return ErrorReport;
};
