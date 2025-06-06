import { Sequelize } from 'sequelize';
import { config } from '../config/config';
import { initModels } from './models';

// Main SQLite database
export const mainDB = new Sequelize({
  dialect: 'sqlite',
  storage: config.SQLITE_PATH,
  logging: false
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
    initModels(mainDB);
    await mainDB.sync();
    console.log('✅ Connected to main SQLite database');
  } catch (err) {
    console.error(
      '❌ Failed to connect to main database:',
      err instanceof Error ? err.message : err
    );
  }

  if (backupDB) {
    try {
      await backupDB.authenticate();
      initModels(backupDB);
      await backupDB.sync();
      console.log('✅ Connected to backup MariaDB database');
      await syncBackupDatabase();
    } catch (err) {
      console.error(
        '❌ Failed to connect to backup database:',
        err instanceof Error ? err.message : err
      );
    }
  }
}

export async function syncBackupDatabase() {
  if (!backupDB) return;

  for (const modelName of Object.keys(mainDB.models)) {
    const mainModel = mainDB.models[modelName];
    const backupModel = backupDB.models[modelName];
    if (!backupModel) continue;
    const records = await mainModel.findAll({ raw: true });
    await backupModel.bulkCreate(records as any[], {
      updateOnDuplicate: Object.keys(mainModel.rawAttributes)
    });
  }

  console.log('🔄 Backup database synchronized');
}
