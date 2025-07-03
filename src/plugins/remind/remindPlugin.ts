import { Client } from 'discord.js';
import { Plugin } from '../types';
import { config } from '../../config/config';
import { initializeGoogleAI } from '../../utils/googleAI';
import { remind } from './commands/remind';
import { reminderChecker } from './events/reminderChecker';
import { reminderButtonHandler } from './events/reminderButtonHandler';
import { reminderModalHandler } from './events/reminderModalHandler';
import chalk from 'chalk';

export const remindPlugin: Plugin = {
    name: 'remind',
    description: 'Plugin to remind users of tasks or events with AI enhancement and interactive controls',
    authors: ['GuikiPT'],
    commands: [remind],
    events: [reminderChecker, reminderButtonHandler, reminderModalHandler],
    async load(client: Client) {
        // Initialize Google AI for reminder enhancement
        const aiInitialized = initializeGoogleAI();
        
        if (aiInitialized) {
            console.log(`🔔 ${chalk.bold(chalk.yellow('Remind plugin loaded with AI enhancement!'))}`);
        } else {
            console.log(`🔔 ${chalk.bold(chalk.yellow('Remind plugin loaded (AI enhancement disabled)!'))}`);
        }
    },
    global: true,
};
