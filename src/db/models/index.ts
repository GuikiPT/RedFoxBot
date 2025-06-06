import { Sequelize } from 'sequelize';
import { initUser, User } from './User';
import { initGuild, Guild } from './Guild';

export function initModels(sequelize: Sequelize) {
  initUser(sequelize);
  initGuild(sequelize);
}

export { User, Guild };
