import { Sequelize } from 'sequelize';
import { initYouTubeSubscription, YouTubeSubscription } from './YouTubeSubscription';
import { initStarBoardConfig, StarBoardConfig } from './StarBoardConfig';

export function initModels(sequelize: Sequelize) {
  initYouTubeSubscription(sequelize);
  initStarBoardConfig(sequelize);
}

export { YouTubeSubscription };
export { StarBoardConfig };
