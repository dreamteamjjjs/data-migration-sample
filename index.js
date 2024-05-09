const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const logger = require('./logger');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

//Database Connection: Two Pool instances are created for connecting to the source and target databases.
const sourcePool = new Pool({
  user: 'user',
  host: 'localhost',
  database: 'source_db',
  password: 'pw',
  port: 5432,
});

const targetPool = new Pool({
  user: 'user',
  host: 'localhost',
  database: 'target_db',
  password: 'pw',
  port: 5432,
});

app.post('/migrate', async (req, res) => {
  try {
    // Data Fetching and Transformation: Data is fetched from the source database's users table, and each user's first_name and last_name are concatenated to form full_name.
    const sourceData = await sourcePool.query('SELECT * FROM users;');
    const transformedData = sourceData.rows.map((row) => ({
      // Transformation logic here
      full_name: `${row.first_name} ${row.last_name}`,
      email: row.email,
    }));

    for (let data of transformedData) {
      await targetPool.query(
        'INSERT INTO new_users (full_name, email) VALUES ($1, $2)',
        [data.full_name, data.email]
      );
    }
    // Logging: All operations are logged using the winston library, recording the successful completion of the migration or any errors that occur.
    logger.info('Migration successful');
    res.send('Migration completed successfully');
  } catch (error) {
    logger.error('Migration failed: ' + error);
    res.status(500).send('Migration failed');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
