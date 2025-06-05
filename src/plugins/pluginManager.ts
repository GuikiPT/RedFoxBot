import { Client } from "discord.js";
import { Plugin, PluginManager, Command } from "./types";

export class DefaultPluginManager implements PluginManager {
  public plugins = new Map<string, Plugin>();
  private listeners = new Map<string, { event: string; handler: (...args: any[]) => void }[]>();

  async loadPlugin(plugin: Plugin, client: Client): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already loaded`);
      return;
    }

    const registered: { event: string; handler: (...args: any[]) => void }[] = [];
    // Register events and keep references to handlers
    for (const event of plugin.events) {
      const handler = (...args: any[]) => event.execute(client, ...args);
      registered.push({ event: event.name, handler });
      if (event.once) {
        client.once(event.name, handler);
      } else {
        client.on(event.name, handler);
      }
    }

    // Call plugin load method
    await plugin.load(client);

    this.plugins.set(plugin.name, plugin);
    this.listeners.set(plugin.name, registered);
    console.log(`✅ Plugin ${plugin.name} loaded successfully`);
  }

  async unloadPlugin(pluginName: string, client: Client): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.warn(`Plugin ${pluginName} is not loaded`);
      return;
    }

    // Remove events registered for this plugin only
    const listeners = this.listeners.get(pluginName) || [];
    for (const { event, handler } of listeners) {
      client.off(event, handler);
    }
    this.listeners.delete(pluginName);

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

  getCommandsForGuild(guildId: string): Command[] {
    const commands: Command[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.guildIds && plugin.guildIds.includes(guildId)) {
        commands.push(...plugin.commands);
      }
    }
    return commands;
  }

  getGlobalCommands(): Command[] {
    const commands: Command[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.global || (!plugin.guildIds && plugin.commands.length > 0 && plugin.global !== false)) {
        commands.push(...plugin.commands);
      }
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
