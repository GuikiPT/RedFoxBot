import { REST, Routes } from "discord.js";
import { config } from "./config/config";
import { DefaultPluginManager } from "./plugins/pluginManager";
import { handleError } from "./utils/errorHandler";
import { commandsChanged } from "./utils/commandCache";

// Function to create a plugin manager with all plugins loaded
function createPluginManagerWithPlugins() {
  const tempPluginManager = new DefaultPluginManager();
  
  // Import plugins directly to avoid circular dependency
  const { corePlugin } = require("./plugins/core/corePlugin");
  const { informationPlugin } = require("./plugins/information/informationPlugin");
  const { ownerPlugin } = require("./plugins/owner/ownerPlugin");
  
  tempPluginManager.plugins.set("core", corePlugin);
  tempPluginManager.plugins.set("information", informationPlugin);
  tempPluginManager.plugins.set("owner", ownerPlugin);
  // Add other plugins here as needed
  // tempPluginManager.plugins.set("example", examplePlugin);
  
  return tempPluginManager;
}

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log(`Deploying commands to guild ${guildId}...`);

    const tempPluginManager = createPluginManagerWithPlugins();
    const commands = tempPluginManager
      .getCommandsForGuild(guildId)
      .map((cmd) => cmd.data);
    const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

    if (commandsChanged(guildId, commands.map((c) => c.toJSON()))) {
      await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId), {
        body: commands,
      });
      console.log(`✅ Commands deployed to guild ${guildId}`);
    } else {
      console.log(`ℹ️ Commands for guild ${guildId} are up to date`);
    }
  } catch (error) {
    handleError(error, 'deployCommands');
  }
}

export async function deployGlobalCommands() {
  try {
    console.log("Deploying global commands...");

    const tempPluginManager = createPluginManagerWithPlugins();
    const commands = tempPluginManager.getGlobalCommands().map((cmd) => cmd.data);
    const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

    if (commandsChanged("global", commands.map((c) => c.toJSON()))) {
      await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), {
        body: commands,
      });
      console.log("✅ Global commands deployed");
    } else {
      console.log("ℹ️ Global commands are up to date");
    }
  } catch (error) {
    handleError(error, 'deployGlobalCommands');
  }
}

export async function deployAllCommands() {
  const manager = createPluginManagerWithPlugins();
  const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

  // Global commands
  const globalCmds = manager.getGlobalCommands().map((c) => c.data);
  if (commandsChanged("global", globalCmds.map((c) => c.toJSON()))) {
    await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), {
      body: globalCmds,
    });
    console.log("✅ Global commands deployed");
  } else {
    console.log("ℹ️ Global commands are up to date");
  }

  // Guild specific commands
  const guildIds = new Set<string>();
  for (const plugin of manager.plugins.values()) {
    if (plugin.guildIds) {
      plugin.guildIds.forEach((id) => guildIds.add(id));
    }
  }

  for (const guildId of guildIds) {
    const cmds = manager.getCommandsForGuild(guildId).map((c) => c.data);
    if (cmds.length === 0) continue;
    if (commandsChanged(guildId, cmds.map((c) => c.toJSON()))) {
      await rest.put(
        Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
        { body: cmds }
      );
      console.log(`✅ Commands deployed to guild ${guildId}`);
    } else {
      console.log(`ℹ️ Commands for guild ${guildId} are up to date`);
    }
  }
}
