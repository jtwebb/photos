const fs = require('fs');
const path = require('path');

module.exports = (dir, filter) => {
  let contents = fs.readdirSync(dir, 'utf8')
    .map(f => path.join(dir, f));

  if (filter) {
    contents = contents.filter(filter);
  }

  return contents;
};
