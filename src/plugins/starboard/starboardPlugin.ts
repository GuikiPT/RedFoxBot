import { Client } from 'discord.js';
import { Plugin } from '../types';
import { config } from '../../config/config';
import chalk from 'chalk';
import { starboard } from './commands/starboard';
import { messageReactionAdd } from './events/messageReactionAdd';
import { messageReactionRemove } from './events/messageReactionRemove';

export const starboardPlugin: Plugin = {
  name: 'starboard',
  description: 'Plugin to Star messages in a channel',
  authors: ['GuikiPT'],
  commands: [ starboard ],
  events: [ messageReactionAdd, messageReactionRemove ],
  async load(client: Client) {
    console.log(`🌠 ${chalk.bold(chalk.yellow('StarBoard plugin loaded!'))}`);
    
    if (config.STARBOARD_SCREENSHOTS_ENABLED) {
      console.log(`📷 ${chalk.green('Screenshots enabled')} with Playwright`);
      if (config.STARBOARD_API_ENDPOINT) {
        console.log(`🔗 ${chalk.cyan('API Endpoint:')} ${config.STARBOARD_API_ENDPOINT}`);
      } else {
        console.log(`🎨 ${chalk.magenta('Using direct HTML generation')}`);
      }
    } else {
      console.log(`📝 ${chalk.gray('Screenshots disabled - using text embeds')}`);
    }
  },
  global: true,
};
