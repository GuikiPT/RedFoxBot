import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { Command } from '../../types';
import { subcommands } from './subcommands';

export const youtube: Command = {
  data: new SlashCommandBuilder()
    .setName('youtube')
    .setDescription('Manage YouTube notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub
        .setName('subscribe')
        .setDescription('Subscribe to a YouTube channel')
        .addStringOption(o =>
          o
            .setName('channel')
            .setDescription('YouTube channel ID, handle (@username), or URL')
            .setRequired(true),
        )
        .addChannelOption(o =>
          o.setName('discord_channel').setDescription('Discord channel').setRequired(true),
        )
        .addRoleOption(o =>
          o
            .setName('mention_role')
            .setDescription('Role to mention for new uploads')
            .setRequired(false),
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('unsubscribe')
        .setDescription('Unsubscribe from the configured YouTube channel')
        .addStringOption(o =>
          o
            .setName('channel')
            .setDescription('YouTube channel ID, handle (@username), or URL')
            .setRequired(true),
        )
    )
    .addSubcommand(sub => sub.setName('list').setDescription('List current subscription'))
    .addSubcommand(sub =>
      sub
        .setName('lookup')
        .setDescription('Look up YouTube channel ID from handle or URL')
        .addStringOption(o =>
          o
            .setName('handle')
            .setDescription('YouTube handle (@username), custom URL, or channel URL')
            .setRequired(true),
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('set-role')
        .setDescription('Set mention role for the current subscription')
        .addStringOption(o =>
          o
            .setName('channel')
            .setDescription('YouTube channel ID, handle (@username), or URL')
            .setRequired(true),
        )
        .addRoleOption(o =>
          o
            .setName('mention_role')
            .setDescription('Role to mention (leave empty to clear)')
            .setRequired(false),
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('force-send-last-video')
        .setDescription('Force send the latest video from the subscribed channel')
    )
    .addSubcommand(sub =>
      sub
        .setName('force-send-video')
        .setDescription('Send a specific YouTube video by URL')
        .addStringOption(o =>
          o
            .setName('url')
            .setDescription('YouTube video URL or video ID')
            .setRequired(true),
        )
        .addChannelOption(o =>
          o
            .setName('channel')
            .setDescription('Discord channel to send the video to (defaults to current channel)')
            .setRequired(false),
        )
    ) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    
    try {
      // Handle lookup subcommand separately as it doesn't require guild context
      if (sub === 'lookup') {
        const lookupHandler = subcommands.get('lookup');
        if (lookupHandler) {
          await lookupHandler.execute(interaction);
        }
        return;
      }

      // All other subcommands require guild context
      if (!interaction.guildId) {
        await interaction.reply({
          content: 'This command can only be used in a guild.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Execute the appropriate subcommand
      const subcommandHandler = subcommands.get(sub);
      if (subcommandHandler) {
        await subcommandHandler.execute(interaction);
      } else {
        await interaction.reply({
          content: 'Unknown subcommand.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (err) {
      console.error('YouTube command failed:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Command failed.', flags: MessageFlags.Ephemeral });
      } else if (interaction.deferred) {
        await interaction.editReply({ content: 'Command failed.' });
      }
    }
  },
};
