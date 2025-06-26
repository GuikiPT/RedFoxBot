import { Client } from 'discord.js';
import { Plugin } from '../types';
import { reload } from './commands/reload';
import { debug } from './commands/debug';
import { config } from '../../config/config';
import chalk from 'chalk';

export const ownerPlugin: Plugin = {
  name: 'owner',
  description: 'Owner only commands',
  authors: ['GuikiPT'],
  commands: [reload, debug],
  events: [],
  async load(client: Client) {
    console.log(`👑 ${chalk.bold(chalk.yellow('Owner plugin loaded!'))}`);
  },
  guildIds: config.OWNER_GUILD_IDS,
};
