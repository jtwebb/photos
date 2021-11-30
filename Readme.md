1. Move all files to central directory
2. Unzip all zip files
3. Delete all zip files
4. Move all files to the root directory
   1. In Windows (https://superuser.com/questions/556033/flatten-directory-structure/1364732):
      1. Select all files (not directories) in the root directory and move them to a new directory outside the root
      2. In root directory search for `*`
      3. Select all, cut, paste into root directory
      4. Cut/Paste files from temp directory back to root directory
   2. On a Mac:
      1. ???
5. Convert heic files to jpgs (`./cli heic`)
6. Delete all files with extensions not allowed (`./cli remove-disallowed`)
7. Create a hash file (`./cli hash`)
   1. Run it with flag `-r` to rename files to `YYY-MM-DD_filename`
   2. This deletes duplicates and moves files with the same hex but different contents to the `duplicates` folder at the same time
8. Move files to output directory. This renames files to `YYY-MM-DD_filename` when moving them.
