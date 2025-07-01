import { REST, Routes, Client, GatewayIntentBits } from 'discord.js';
import prompts from 'prompts';
import 'better-logging';
import { config } from './config/config';
import './logger'; // This enhances console with better logging
import { DefaultPluginManager } from './plugins/pluginManager';
import { defaultPlugins } from './plugins/pluginList';
import { Command } from './plugins/types';

interface ActionChoice {
    title: string;
    value: string;
}

export async function deploySlashCommands(): Promise<void> {
    console.info('Starting Slash Command Deployment System...');

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    try {
        await client.login(config.DISCORD_TOKEN);
        console.info(`Logged in as ${client.user?.tag} for Slash Command Deployment.`);

        const actionChoices: ActionChoice[] = [
            { title: 'Register Global Commands', value: 'registerGlobal' },
            { title: 'Register Test Guild Commands', value: 'registerTestGuild' },
            { title: 'Delete Single Global Command', value: 'deleteSingleGlobal' },
            { title: 'Delete Single Test Guild Command', value: 'deleteSingleTestGuild' },
            { title: 'Delete All Global Commands', value: 'deleteAllGlobal' },
            { title: 'Delete All Test Guild Commands', value: 'deleteAllTestGuild' }
        ];

        const { action } = await prompts({
            type: 'select',
            name: 'action',
            message: 'What would you like to do?',
            choices: actionChoices
        });

        if (!action) {
            console.warn('No action selected. Exiting...');
            return;
        }

        let commandName: string | undefined;
        let guildId: string | undefined;

        if (action.startsWith('deleteSingle')) {
            commandName = await promptInput('Enter the command name to delete:', 'Command name is required!');
        }

        if (action.endsWith('TestGuild')) {
            guildId = await promptInput('Enter the test guild ID:', 'Guild ID is required!');
        }

        switch (action) {
            case 'registerGlobal':
                await registerCommands(client);
                break;
            case 'registerTestGuild':
                await registerCommands(client, guildId!);
                break;
            case 'deleteSingleGlobal':
                await deleteSingleCommand(client, commandName!);
                break;
            case 'deleteSingleTestGuild':
                await deleteSingleCommand(client, commandName!, guildId!);
                break;
            case 'deleteAllGlobal':
                await confirmAndDeleteAll(client, 'global');
                break;
            case 'deleteAllTestGuild':
                await confirmAndDeleteAll(client, 'test guild', guildId!);
                break;
            default:
                console.warn('Invalid action specified.');
        }
    } catch (error) {
        console.error('Error during Slash Command Deployment:', error);
    } finally {
        console.warn('Shutting down Slash Command Deployment System gracefully...');
        await client.destroy();
    }
}

async function promptInput(message: string, validationMessage = 'Input is required'): Promise<string> {
    const { input } = await prompts({
        type: 'text',
        name: 'input',
        message,
        validate: (input: string) => input ? true : validationMessage
    });
    return input;
}

async function confirmAndDeleteAll(client: Client, type: string, guildId?: string): Promise<void> {
    const { confirmDelete } = await prompts({
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to delete all ${type} commands?`,
        initial: false
    });

    if (confirmDelete) {
        await deleteAllCommands(client, guildId);
    } else {
        console.info(`Deletion of all ${type} commands canceled.`);
    }
}

async function loadCommands(): Promise<any[]> {
    const commands: any[] = [];

    try {
        // Load all commands from the default plugins
        for (const plugin of defaultPlugins) {
            // Add all commands from this plugin
            for (const command of plugin.commands) {
                commands.push(command.data.toJSON());
            }
        }

        console.info(`Loaded ${commands.length} commands successfully.`);
        return commands;
    } catch (error) {
        console.error('Failed to load commands:', error);
        return [];
    }
}

async function registerCommands(client: Client, guildId?: string): Promise<void> {
    const commands = await loadCommands();
    const rest = createRestClient();

    try {
        const route = guildId
            ? Routes.applicationGuildCommands(client.user!.id, guildId)
            : Routes.applicationCommands(client.user!.id);

        const data = await rest.put(route, { body: commands }) as any[];
        console.info(`Successfully reloaded ${data.length} ${guildId ? 'guild-specific' : 'application'} (/) commands.`);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

async function deleteSingleCommand(client: Client, commandName: string, guildId?: string): Promise<void> {
    const rest = createRestClient();

    try {
        const route = guildId
            ? Routes.applicationGuildCommands(client.user!.id, guildId)
            : Routes.applicationCommands(client.user!.id);

        const commands = await rest.get(route) as any[];
        const command = commands.find(cmd => cmd.name === commandName);
        
        if (!command) {
            console.warn(`No command found with name: ${commandName}`);
            return;
        }

        const deleteRoute = guildId
            ? Routes.applicationGuildCommand(client.user!.id, guildId, command.id)
            : Routes.applicationCommand(client.user!.id, command.id);

        await rest.delete(deleteRoute);
        console.info(`Successfully deleted command: ${commandName}`);
    } catch (error) {
        console.error('Error deleting command:', error);
    }
}

async function deleteAllCommands(client: Client, guildId?: string): Promise<void> {
    const rest = createRestClient();

    try {
        const route = guildId
            ? Routes.applicationGuildCommands(client.user!.id, guildId)
            : Routes.applicationCommands(client.user!.id);

        await rest.put(route, { body: [] });
        console.info(`Successfully deleted all ${guildId ? 'guild-specific' : 'application'} commands.`);
    } catch (error) {
        console.error('Error deleting all commands:', error);
    }
}

function createRestClient(): REST {
    return new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);
}

// Run the deployer if this file is executed directly
if (require.main === module) {
    deploySlashCommands().catch(console.error);
}
