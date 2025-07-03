import { Sequelize } from 'sequelize';
import { initYouTubeSubscription, YouTubeSubscription } from './YouTubeSubscription';
import { initStarBoardConfig, StarBoardConfig } from './StarBoardConfig';
import { initStarBoardMessage, StarBoardMessage } from './StarBoardMessage';
import { initReminder, Reminder } from './Reminder';

export function initModels(sequelize: Sequelize) {
  initYouTubeSubscription(sequelize);
  initStarBoardConfig(sequelize);
  initStarBoardMessage(sequelize);
  initReminder(sequelize);
}

export { YouTubeSubscription };
export { StarBoardConfig };
export { StarBoardMessage };
export { Reminder };
