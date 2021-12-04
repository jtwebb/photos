1. Fill out the `.env` file with database and path details
2. Run `cli sync` to create the tables needed in the database
3. Run `cli init` to gather all the image data you need. This could take a while.
4. 
5. Move all files to the root directory
   1. In Windows (https://superuser.com/questions/556033/flatten-directory-structure/1364732):
      1. Select all files (not directories) in the root directory and move them to a new directory outside the root
      2. In root directory search for `*`
      3. Select all, cut, paste into root directory
      4. Cut/Paste files from temp directory back to root directory
   2. On a Mac:
      1. ???
6. Convert heic files to jpgs (`./cli heic`)
7. Delete all files with extensions not allowed (`./cli remove-disallowed`)
8. Create a hash file (`./cli hash`)
   1. Run it with flag `-r` to rename files to `YYY-MM-DD_filename`
   2. This deletes duplicates and moves files with the same hex but different contents to the `duplicates` folder at the same time
9. Move files to output directory. This renames files to `YYY-MM-DD_filename` when moving them.
