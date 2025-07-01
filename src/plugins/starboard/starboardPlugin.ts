import { Client } from 'discord.js';
import { Plugin } from '../types';
import { config } from '../../config/config';
import chalk from 'chalk';
import { starboard } from './commands/starboard';

export const starboardPlugin: Plugin = {
  name: 'starboard',
  description: 'Plugin to Star messages in a channel',
  authors: ['GuikiPT'],
  commands: [ starboard ],
  events: [],
  async load(client: Client) {
    console.log(`🌠 ${chalk.bold(chalk.yellow('StarBoard plugin loaded!'))}`);
  },
  global: true,
};
