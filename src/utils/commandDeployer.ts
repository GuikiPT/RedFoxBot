import { REST, Routes } from 'discord.js';
import { config } from '../config/config';
import { DefaultPluginManager } from '../plugins/pluginManager';
import { commandsChanged } from './commandCache';

function createRestClient() {
  return new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);
}

export async function deployGlobalCommands(manager: DefaultPluginManager) {
  const commands = manager.getGlobalCommands().map(c => c.data);
  if (commandsChanged('global', commands.map(c => c.toJSON()))) {
    const rest = createRestClient();
    await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), { body: commands });
    console.log('✅ Global commands deployed successfully!');
  } else {
    console.log('ℹ️  Global commands are up to date');
  }
}

export async function deployGuildCommands(manager: DefaultPluginManager, guildId: string) {
  const cmds = manager.getCommandsForGuild(guildId).map(c => c.data);
  if (cmds.length === 0) return;
  if (commandsChanged(guildId, cmds.map(c => c.toJSON()))) {
    const rest = createRestClient();
    await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId), { body: cmds });
    console.log(`✅ Commands deployed to ${guildId}!`);
  }
}
