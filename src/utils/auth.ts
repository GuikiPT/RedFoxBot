import { config } from '../config/config';

export function isBotOwner(userId: string): boolean {
  return config.BOT_OWNER_IDS.includes(userId);
}
