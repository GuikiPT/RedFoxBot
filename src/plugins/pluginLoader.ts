import { Client } from "discord.js";
import { Plugin } from "./types";
import { DefaultPluginManager } from "./pluginManager";
import { corePlugin } from "./core/corePlugin";
import { informationPlugin } from "./information/informationPlugin";
import { ownerPlugin } from "./owner/ownerPlugin";
import { handleError } from "../utils/errorHandler";
// import { examplePlugin } from "./example/examplePlugin";

export class PluginLoader {
  private pluginManager: DefaultPluginManager;
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.pluginManager = new DefaultPluginManager();
    // Attach plugin manager to client for easy access
    (client as any).pluginManager = this.pluginManager;
    (client as any).pluginLoader = this;
  }

  async loadAllPlugins(): Promise<void> {
    const plugins = [
      corePlugin,
      informationPlugin,
      ownerPlugin,
      // examplePlugin, // Uncomment to enable the example plugin
    ];

    console.log("🔌 Loading plugins...");
    
    for (const plugin of plugins) {
      try {
        await this.pluginManager.loadPlugin(plugin, this.client);
      } catch (error) {
        handleError(error, `❌ Failed to load plugin ${plugin.name}`);
      }
    }

    console.log(
      `✅ Loaded ${this.pluginManager.plugins.size} plugins successfully`
    );

    const loadedPlugins = Array.from(this.pluginManager.plugins.values());
    if (loadedPlugins.length > 0) {
      const pluginInfos = loadedPlugins.map(plugin => ({
        name: plugin.name,
        authors: plugin.authors.join(', '),
        events: plugin.events.length > 0
          ? plugin.events.map(e => e.name).join(', ')
          : '-',
        commands: plugin.commands.length > 0
          ? plugin.commands.map(c => c.data.name).join(', ')
          : '-',
      }));

      const nameWidth = Math.max('Name'.length, ...pluginInfos.map(i => i.name.length));
      const authorsWidth = Math.max('Authors'.length, ...pluginInfos.map(i => i.authors.length));
      const eventsWidth = Math.max('Events'.length, ...pluginInfos.map(i => i.events.length));
      const commandsWidth = Math.max('Commands'.length, ...pluginInfos.map(i => i.commands.length));

      const top = `┌${'─'.repeat(nameWidth + 2)}┬${'─'.repeat(authorsWidth + 2)}┬${'─'.repeat(eventsWidth + 2)}┬${'─'.repeat(commandsWidth + 2)}┐`;
      const header = `│ ${'Name'.padEnd(nameWidth)} │ ${'Authors'.padEnd(authorsWidth)} │ ${'Events'.padEnd(eventsWidth)} │ ${'Commands'.padEnd(commandsWidth)} │`;
      const mid = `├${'─'.repeat(nameWidth + 2)}┼${'─'.repeat(authorsWidth + 2)}┼${'─'.repeat(eventsWidth + 2)}┼${'─'.repeat(commandsWidth + 2)}┤`;
      const bottom = `└${'─'.repeat(nameWidth + 2)}┴${'─'.repeat(authorsWidth + 2)}┴${'─'.repeat(eventsWidth + 2)}┴${'─'.repeat(commandsWidth + 2)}┘`;

      const lines = [top, header, mid];

      for (const info of pluginInfos) {
        lines.push(
          `│ ${info.name.padEnd(nameWidth)} │ ${info.authors.padEnd(authorsWidth)} │ ${info.events.padEnd(eventsWidth)} │ ${info.commands.padEnd(commandsWidth)} │`
        );
      }

      lines.push(bottom);
      console.log(`\n${lines.join('\n')}\n`);
    }
  }

  async unloadAllPlugins(): Promise<void> {
    console.log("🔌 Unloading plugins...");
    
    const pluginNames = Array.from(this.pluginManager.plugins.keys());
    
    for (const pluginName of pluginNames) {
      try {
        await this.pluginManager.unloadPlugin(pluginName, this.client);
      } catch (error) {
        handleError(error, `❌ Failed to unload plugin ${pluginName}`);
      }
    }

    console.log("✅ All plugins unloaded");
  }

  getPluginManager(): DefaultPluginManager {
    return this.pluginManager;
  }
}
