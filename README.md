# RedFoxBot

A modern Discord bot built with TypeScript and a modular plugin architecture.

## Features

- 🔌 **Plugin System**: Modular architecture for easy extensibility
- ⚡ **TypeScript**: Full type safety and modern JavaScript features
- 🚀 **Slash Commands**: Modern Discord slash command support
- 🎯 **Event Handling**: Flexible event system through plugins
- 🛠️ **Easy Development**: Hot-reloadable plugin system

## Project Structure

```
src/
├── config/
│   └── config.ts           # Configuration management
├── plugins/                # Plugin system
│   ├── types.ts           # Plugin interfaces
│   ├── pluginManager.ts   # Plugin management logic
│   ├── pluginLoader.ts    # Plugin loading utilities
│   ├── README.md          # Plugin development guide
│   ├── core/              # Core bot functionality
│   │   ├── corePlugin.ts
│   │   └── events/
│   │       ├── clientReady.ts
│   │       ├── guildCreate.ts
│   │       └── interactionCreate.ts
│   ├── information/       # Information commands
│   │   ├── informationPlugin.ts
│   │   └── commands/
│   │       └── ping.ts
│   └── example/           # Example plugin for reference
│       ├── examplePlugin.ts
│       ├── commands/
│       │   └── hello.ts
│       └── events/
│           └── messageCreate.ts
├── deployer.ts            # Command deployment utility
└── index.ts              # Main bot entry point
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Discord application and bot token

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Discord credentials:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   BOT_OWNER_IDS=your_discord_user_id
   OWNER_GUILD_IDS=optional_guild_ids_csv
   LOG_TO_FILE=true
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Run the bot:
   ```bash
   npm start
   ```

## Plugin Development

The bot uses a modular plugin system. Each plugin can provide:

- **Commands**: Slash commands that users can execute
- **Events**: Discord.js event handlers
- **Initialization**: Setup and cleanup logic

### Creating a New Plugin

1. Create a new directory in `src/plugins/yourplugin/`
2. Add `commands/` and `events/` subdirectories
3. Create your plugin file following the examples
4. Register the plugin in `pluginLoader.ts`

See `src/plugins/README.md` for detailed plugin development instructions.

## Available Commands

- `/ping` - Check bot latency and responsiveness
- `/hello` - Greet a user with a friendly message (example plugin)

## Scripts

- `npm run build` - Build the TypeScript project
- `npm start` - Start the bot
- `npm run dev` - Start in development mode (if configured)
- `npm run deploy` - Deploy slash commands without starting the bot

## Architecture

### Plugin System

The bot is built around a plugin architecture that provides:

- **Modularity**: Each feature is a separate plugin
- **Hot-loading**: Plugins can be loaded/unloaded at runtime
- **Type Safety**: Full TypeScript support throughout
- **Event Handling**: Automatic Discord.js event registration
- **Command Management**: Automatic slash command registration and routing

### Core Components

- **PluginManager**: Handles plugin lifecycle and command routing
- **PluginLoader**: Manages plugin discovery and loading
- **Event System**: Automatic event handler registration
- **Command System**: Slash command registration and execution

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style and plugin structure
4. Test your changes thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
