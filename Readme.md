This checks photos in a particular directory to see if duplicates or similar images exists. It store all information in a database.

Coming soon probably: a command to actually move files to an output directory.

1. Fill out the `.env` file with database and path details.
2. Run `cli sync` to create the tables needed in the database.
3. Run `cli init` to gather all the image data you need. This could take a while.
4. Run `cli compare` (if you chose to get the `pHash` in `init`)
5. Finally, run `cli copy` to copy the files over to the output directory
