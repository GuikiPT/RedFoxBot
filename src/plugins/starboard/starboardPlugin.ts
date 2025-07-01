import { Client } from 'discord.js';
import { Plugin } from '../types';
import { config } from '../../config/config';
import chalk from 'chalk';

export const starboardPlugin: Plugin = {
  name: 'starboard',
  description: 'Plugin to Star messages in a channel',
  authors: ['GuikiPT'],
  commands: [],
  events: [],
  async load(client: Client) {
    console.log(`🌠 ${chalk.bold(chalk.yellow('StarBoard plugin loaded!'))}`);
  },
  guildIds: config.OWNER_GUILD_IDS,
};
