import { Client } from "discord.js";
import { config } from "./config/config";
import { PluginLoader } from "./plugins";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

// Initialize plugin loader
const pluginLoader = new PluginLoader(client);

// Initialize bot
async function initializeBot() {
  try {
    console.log("🚀 Starting RedFoxBot...");
    
    // Load all plugins
    await pluginLoader.loadAllPlugins();
    
    // Login to Discord
    await client.login(config.DISCORD_TOKEN);
    
  } catch (error) {
    console.error("❌ Failed to initialize bot:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down bot...");
  await pluginLoader.unloadAllPlugins();
  await client.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down bot...");
  await pluginLoader.unloadAllPlugins();
  await client.destroy();
  process.exit(0);
});

initializeBot();
