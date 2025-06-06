import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { YouTubeSubscription } from '../../../db/models';

export const youtube: Command = {
  data: new SlashCommandBuilder()
    .setName('youtube')
    .setDescription('Manage YouTube notifications')
    .addSubcommand(sub =>
      sub
        .setName('subscribe')
        .setDescription('Subscribe to a YouTube channel')
        .addStringOption(o =>
          o.setName('channel_id').setDescription('YouTube channel ID').setRequired(true)
        )
        .addChannelOption(o =>
          o.setName('discord_channel').setDescription('Discord channel').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('unsubscribe')
        .setDescription('Unsubscribe from a YouTube channel')
        .addStringOption(o =>
          o.setName('channel_id').setDescription('YouTube channel ID').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('List current subscriptions')
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    try {
      if (!interaction.guildId) {
        await interaction.reply({ content: 'This command can only be used in a guild.', ephemeral: true });
        return;
      }

      if (sub === 'subscribe') {
        const channelId = interaction.options.getString('channel_id', true);
        const discordChannel = interaction.options.getChannel('discord_channel', true);
        if (!discordChannel.isTextBased()) {
          await interaction.reply({ content: 'Please select a text channel.', ephemeral: true });
          return;
        }
        await YouTubeSubscription.create({
          guildId: interaction.guildId,
          youtubeChannelId: channelId,
          discordChannelId: discordChannel.id,
          lastVideoId: null,
        });
        await interaction.reply({ content: `Subscribed to ${channelId} in ${discordChannel}.`, ephemeral: true });
      } else if (sub === 'unsubscribe') {
        const channelId = interaction.options.getString('channel_id', true);
        const count = await YouTubeSubscription.destroy({ where: { guildId: interaction.guildId, youtubeChannelId: channelId } });
        if (count > 0) {
          await interaction.reply({ content: `Unsubscribed from ${channelId}.`, ephemeral: true });
        } else {
          await interaction.reply({ content: `No subscription found for ${channelId}.`, ephemeral: true });
        }
      } else if (sub === 'list') {
        const subs = await YouTubeSubscription.findAll({ where: { guildId: interaction.guildId } });
        if (subs.length === 0) {
          await interaction.reply({ content: 'No subscriptions found.', ephemeral: true });
        } else {
          const lines = subs.map(s => `${s.youtubeChannelId} -> <#${s.discordChannelId}>`);
          await interaction.reply({ content: `Subscriptions:\n${lines.join('\n')}`, ephemeral: true });
        }
      }
    } catch (err) {
      console.error('YouTube command failed:', err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'Command failed.', ephemeral: true });
      }
    }
  }
};
