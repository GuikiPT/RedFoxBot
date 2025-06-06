import { Sequelize } from 'sequelize';
import { initUser, User } from './User';
import { initGuild, Guild } from './Guild';
import { initYouTubeSubscription, YouTubeSubscription } from './YouTubeSubscription';

export function initModels(sequelize: Sequelize) {
  initUser(sequelize);
  initGuild(sequelize);
  initYouTubeSubscription(sequelize);
}

export { User, Guild, YouTubeSubscription };
