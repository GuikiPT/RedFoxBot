import { REST, Routes } from "discord.js";
import { config } from "./config/config";
import { DefaultPluginManager } from "./plugins/pluginManager";
import { handleError } from "./utils/errorHandler";

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
    console.log("Started refreshing application (/) commands.");

    const tempPluginManager = createPluginManagerWithPlugins();
    const commandsData = tempPluginManager.getCommandsForGuild(guildId).map((command) => command.data);
    const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    handleError(error, 'deployCommands');
  }
}

export async function deployGlobalCommands() {
  try {
    console.log("Started refreshing global application (/) commands.");

    const tempPluginManager = createPluginManagerWithPlugins();
    const commandsData = tempPluginManager.getGlobalCommands().map((command) => command.data);
    const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationCommands(config.DISCORD_CLIENT_ID),
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded global application (/) commands.");
  } catch (error) {
    handleError(error, 'deployGlobalCommands');
  }
}
