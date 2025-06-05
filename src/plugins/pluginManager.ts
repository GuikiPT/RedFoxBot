import { Client } from "discord.js";
import { Plugin, PluginManager, Command } from "./types";

export class DefaultPluginManager implements PluginManager {
  public plugins = new Map<string, Plugin>();

  async loadPlugin(plugin: Plugin, client: Client): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already loaded`);
      return;
    }

    // Register events
    for (const event of plugin.events) {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
      }
    }

    // Call plugin load method
    await plugin.load(client);

    this.plugins.set(plugin.name, plugin);
    console.log(`✅ Plugin ${plugin.name} loaded successfully`);
  }

  async unloadPlugin(pluginName: string, client: Client): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.warn(`Plugin ${pluginName} is not loaded`);
      return;
    }

    // Remove events
    for (const event of plugin.events) {
      client.removeAllListeners(event.name);
    }

    // Call plugin unload method if available
    if (plugin.unload) {
      await plugin.unload(client);
    }

    this.plugins.delete(pluginName);
    console.log(`🔌 Plugin ${pluginName} unloaded successfully`);
  }

  getAllCommands(): Command[] {
    const commands: Command[] = [];
    for (const plugin of this.plugins.values()) {
      commands.push(...plugin.commands);
    }
    return commands;
  }

  getCommand(commandName: string): Command | undefined {
    for (const plugin of this.plugins.values()) {
      const command = plugin.commands.find(cmd => cmd.data.name === commandName);
      if (command) {
        return command;
      }
    }
    return undefined;
  }
}
