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

    console.log(`✅ Loaded ${this.pluginManager.plugins.size} plugins successfully`);

    const tableData = Array.from(this.pluginManager.plugins.values()).map(p => ({
      Name: p.name,
      Authors: p.authors.join(', '),
      Events: p.events.length,
      Commands: p.commands.length,
    }));
    console.table(tableData);
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
