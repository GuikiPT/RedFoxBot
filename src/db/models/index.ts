import { Sequelize } from 'sequelize';
import { initYouTubeSubscription, YouTubeSubscription } from './YouTubeSubscription';
import { initStarBoardConfig, StarBoardConfig } from './StarBoardConfig';
import { initStarBoardMessage, StarBoardMessage } from './StarBoardMessage';

export function initModels(sequelize: Sequelize) {
  initYouTubeSubscription(sequelize);
  initStarBoardConfig(sequelize);
  initStarBoardMessage(sequelize);
}

export { YouTubeSubscription };
export { StarBoardConfig };
export { StarBoardMessage };
