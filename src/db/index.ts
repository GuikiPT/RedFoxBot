import { Sequelize } from 'sequelize';
import { config } from '../config/config';

// Main database using better-sqlite3
export const mainDB = new Sequelize({
  dialect: 'sqlite',
  storage: config.SQLITE_PATH,
  logging: false,
  dialectModule: require('better-sqlite3')
});

// Optional backup MariaDB/MySQL database
export const backupDB = config.MARIADB_HOST && config.MARIADB_DB && config.MARIADB_USER
  ? new Sequelize(config.MARIADB_DB, config.MARIADB_USER, config.MARIADB_PASSWORD || '', {
      host: config.MARIADB_HOST,
      port: config.MARIADB_PORT || 3306,
      dialect: 'mariadb',
      logging: false
    })
  : undefined;

export async function initDatabases() {
  try {
    await mainDB.authenticate();
    console.log('✅ Connected to main SQLite database');
  } catch (err) {
    console.error('❌ Failed to connect to main database:', err);
  }

  if (backupDB) {
    try {
      await backupDB.authenticate();
      console.log('✅ Connected to backup MariaDB database');
    } catch (err) {
      console.error('❌ Failed to connect to backup database:', err);
    }
  }
}
