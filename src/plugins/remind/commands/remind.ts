import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  MessageFlags,
} from 'discord.js';
import { subcommands } from './subcommands';

export const remind = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Manage your personal reminders with AI enhancement')
    .setContexts([InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild])
    .setIntegrationTypes([ApplicationIntegrationType.UserInstall, ApplicationIntegrationType.GuildInstall])
    .addSubcommand(sub =>
      sub
        .setName('reminder')
        .setDescription('Create a new reminder')
        .addStringOption(o =>
          o
            .setName('description')
            .setDescription('Description including when to remind you (e.g., "Buy milk in 30 minutes", "Meeting tomorrow at 2pm")')
            .setRequired(true)
            .setMaxLength(1000)
        )
        .addBooleanOption(o =>
          o
            .setName('public')
            .setDescription('Show this reminder publicly in the channel (default: private)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list_reminders')
        .setDescription('List your reminders')
        .addBooleanOption(o =>
          o
            .setName('show_completed')
            .setDescription('Show completed reminders as well')
            .setRequired(false)
        )
        .addBooleanOption(o =>
          o
            .setName('public')
            .setDescription('Show the list publicly in the channel (default: private)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('delete_reminder')
        .setDescription('Delete a specific reminder')
        .addIntegerOption(o =>
          o
            .setName('reminder_id')
            .setDescription('ID of the reminder to delete')
            .setRequired(true)
        )
        .addBooleanOption(o =>
          o
            .setName('public')
            .setDescription('Show the deletion confirmation publicly in the channel (default: private)')
            .setRequired(false)
        )
    ),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommandName = interaction.options.getSubcommand();
    const subcommand = subcommands.find(cmd => cmd.name === subcommandName);
    
    if (!subcommand) {
      await interaction.reply({
        content: '❌ **Error:** Unknown subcommand.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    try {
      await subcommand.handler(interaction);
    } catch (error) {
      console.error(`Error executing remind subcommand "${subcommandName}":`, error);
      
      const content = '❌ **Error:** Something went wrong while processing your reminder command.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    }
  },
  
  global: true, // User registration instead of guild registration
};