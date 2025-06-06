import { config } from "./config/config";
import { DefaultPluginManager } from "./plugins/pluginManager";
import { defaultPlugins } from "./plugins/pluginList";
import { handleError } from "./utils/errorHandler";
import { deployGuildCommands as deployGuild, deployGlobalCommands as deployGlobal } from "./utils/commandDeployer";

// Function to create a plugin manager with all plugins loaded
function createPluginManagerWithPlugins() {
  const manager = new DefaultPluginManager();
  for (const plugin of defaultPlugins) {
    manager.plugins.set(plugin.name, plugin);
  }
  return manager;
}

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log(`🚀 Deploying commands to guild ${guildId}...`);

    const manager = createPluginManagerWithPlugins();
    await deployGuild(manager, guildId);
  } catch (error) {
    handleError(error, 'deployCommands');
  }
}

export async function deployGlobalCommands() {
  try {
    console.log("🚀 Deploying global commands...");
    const manager = createPluginManagerWithPlugins();
    await deployGlobal(manager);
  } catch (error) {
    handleError(error, 'deployGlobalCommands');
  }
}

export async function deployAllCommands() {
  const manager = createPluginManagerWithPlugins();
  await deployGlobal(manager);

  // Guild specific commands
  const guildIds = new Set<string>();
  for (const plugin of manager.plugins.values()) {
    if (plugin.guildIds) {
      plugin.guildIds.forEach((id) => guildIds.add(id));
    }
  }

  for (const guildId of guildIds) {
    await deployGuild(manager, guildId);
  }
}
