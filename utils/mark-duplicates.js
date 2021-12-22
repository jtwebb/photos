const { QueryTypes } = require('sequelize');

module.exports = async (db, PhotoDetails) => {
  await db.query(`
    update photoDetails pd
    join (
      select p.id, p.sourceFilename, min(\`year\`) from photoDetails p
      inner join (
        select pp.\`hash\`, min(length(sourceFilename)) as minLen from photoDetails pp
        where pp.\`hash\` in (select \`hash\` from photoDetails group by \`hash\` having count(id) > 1)
        group by pp.\`hash\`
      ) pd2 on pd2.\`hash\` = p.\`hash\`
      where id != (
        select min(id) as id from photoDetails where \`hash\` = p.\`hash\` and length(sourceFilename) = pd2.minLen
      )
      group by p.sourceFilename, p.id
    ) pd3 on pd3.id = pd.id
    set isDuplicate = 1
  `, { type: QueryTypes.UPDATE, logging: console.log });

  const { count } = await PhotoDetails.findAndCountAll({ where: { isDuplicate: true } });

  return count;
};
