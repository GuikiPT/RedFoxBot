import { Client } from 'discord.js';
import { Plugin } from '../types';
import { youtube } from './commands/youtube';
import { checkSubscriptions } from './functions/checkSubscriptions';
import chalk from 'chalk';

let interval: NodeJS.Timeout | undefined;

export const youtubePlugin: Plugin = {
  name: 'youtube',
  description: 'Notifies about new YouTube uploads',
  authors: ['GuikiPT'],
  commands: [youtube],
  events: [],
  global: true,
  async load(client: Client) {
    console.log(`🟥 ${chalk.bold(chalk.red('YouTube plugin loaded!'))}`);
    console.log('[YouTube Plugin] Setting up YouTube subscription checker (1 minute intervals)');

    await checkSubscriptions(client).catch(err =>
      console.error('[YouTube Plugin] Initial check failed:', err)
    );
    interval = setInterval(
      () =>
        checkSubscriptions(client).catch(err =>
          console.error('[YouTube Plugin] Periodic check failed:', err)
        ),
      1 * 60 * 1000
    );
  },
  async unload() {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
  },
};
