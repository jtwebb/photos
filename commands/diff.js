const fs = require('fs');
const path = require('path');
const { compare } = require('odiff-bin');

exports.command = 'diff';
exports.aliases = [];
exports.describe = '';

exports.builder = (argv) => {
  return argv;
};

exports.handler = () => {};
