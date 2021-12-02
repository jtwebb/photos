UPDATE exifs eee right join (
  select e.id
  from exifs e
  join (
    select `hash`, min(length(sourceFile)) as minFileLength
    from exifs
    group by `hash`
  ) as ee
  on e.`hash` = ee.`hash` and length(e.sourceFile) = ee.minFileLength
) as e on eee.id = e.id
set isDuplicate = 0

/*select `sourceFile`, `hash` from `exifs` eee left join (select e.id
  from exifs e
  join (
    select `hash`, min(length(sourceFile)) as minFileLength
    from exifs
    group by `hash`
  ) as ee
  on e.`hash` = ee.`hash` and length(e.sourceFile) = ee.minFileLength
) as e on eee.id = e.id
where sourceFile like '%/Volumes/FreeAgent/20130525_155109%'*/
