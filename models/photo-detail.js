const { DataTypes: DT, Model } = require('sequelize');

module.exports = (sequelize) => {
  class PhotoDetails extends Model {}

  PhotoDetails.init({
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
    outputPath: {
      type: DT.STRING,
      allowNull: false
    },
    sourceFilename: {
      type: DT.STRING,
      allowNull: false
    },
    outputFilename: {
      type: DT.STRING,
      allowNull: false
    },
    imageHeight: {
      type: DT.INTEGER
    },
    imageWidth: {
      type: DT.INTEGER
    },
    fileType: {
      type: DT.STRING
    },
    fileTypeExtension: {
      type: DT.STRING
    },
    fileSize: {
      type: DT.STRING
    },
    year: {
      type: DT.INTEGER
    },
    month: {
      type: DT.INTEGER
    },
    day: {
      type: DT.INTEGER
    },
    hasHashBeenCompared: {
      type: DT.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    hasPHashBeenCompared: {
      type: DT.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isDuplicate: {
      type: DT.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    hasMoved: {
      type: DT.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isSimilar: {
      type: DT.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    hash: {
      type: DT.STRING
    },
    pHash: {
      type: DT.STRING
    }
  }, {
    sequelize,
    modelName: 'photoDetail',
    timestamps: true,
    tableName: 'photoDetails',
    // These are need when uploading hashes as this could take a long.
    indexes: [
      {
        name: 'hash_sourcePath_index',
        using: 'BTREE',
        fields: [
          'sourcePath',
          'hash'
        ]
      },
      {
        name: 'hash_index',
        using: 'BTREE',
        fields: [
          'hash'
        ]
      },
      {
        name: 'pHash_sourcePath_index',
        using: 'BTREE',
        fields: [
          'outputPath',
          'pHash'
        ]
      },
      {
        name: 'id_sourceFilename_year_index',
        using: 'BTREE',
        fields: [
          'id',
          'sourceFilename',
          'year'
        ]
      },
      {
        name: 'hash_sourceFilename_index',
        using: 'BTREE',
        fields: [
          'hash',
          'sourceFilename'
        ]
      },
      {
        name: 'pHash_index',
        using: 'BTREE',
        fields: [
          'pHash'
        ]
      },
      {
        name: 'sourceFilename_index',
        using: 'BTREE',
        fields: [
          'sourceFilename'
        ]
      },
      {
        name: 'isDuplicate_index',
        using: 'BTREE',
        fields: [
          'isDuplicate'
        ]
      },
      {
        name: 'hasMoved_index',
        using: 'BTREE',
        fields: [
          'hasMoved'
        ]
      },
      {
        name: 'isSimilar_index',
        using: 'BTREE',
        fields: [
          'isSimilar'
        ]
      },
      {
        name: 'hasPHashBeenCompared_index',
        using: 'BTREE',
        fields: [
          'hasPHashBeenCompared'
        ]
      },
      {
        name: 'hasHashBeenCompared_index',
        using: 'BTREE',
        fields: [
          'hasHashBeenCompared'
        ]
      },
      {
        name: 'year_index',
        using: 'BTREE',
        fields: [
          'year'
        ]
      }
    ]
  });

  return PhotoDetails;
};
