import { Sequelize } from 'sequelize';
import { initYouTubeSubscription, YouTubeSubscription } from './YouTubeSubscription';

export function initModels(sequelize: Sequelize) {
  initYouTubeSubscription(sequelize);
}

export { YouTubeSubscription };
