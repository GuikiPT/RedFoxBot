import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import { Command } from '../../types';
import { YouTubeSubscription } from '../../../db/models';
import { resolveYouTubeHandle } from '../../../utils/youtubeHandleResolver';
import { XMLTubeInfoFetcher } from '../../../utils/xmlTubeInfoFetcher';

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
    )
    .addSubcommand(sub =>
      sub
        .setName('lookup')
        .setDescription('Look up YouTube channel ID from handle or URL')
        .addStringOption(o =>
          o.setName('handle').setDescription('YouTube handle (@username), custom URL, or channel URL').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('subscribe-handle')
        .setDescription('Subscribe to a YouTube channel using handle')
        .addStringOption(o =>
          o.setName('handle').setDescription('YouTube handle (@username) or custom URL').setRequired(true)
        )
        .addChannelOption(o =>
          o.setName('discord_channel').setDescription('Discord channel').setRequired(true)
        )
    ) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    try {
      if (sub === 'lookup') {
        const handle = interaction.options.getString('handle', true);
        
        await interaction.deferReply({ ephemeral: true });
        
        const result = await resolveYouTubeHandle(handle);
        
        if (result.channelId) {
          // Try to get channel info to verify it works
          const channelInfo = await XMLTubeInfoFetcher(result.channelId);
          
          const embed = new EmbedBuilder()
            .setTitle('✅ YouTube Channel Found')
            .setColor(0x00FF00)
            .addFields(
              { name: 'Input', value: handle, inline: true },
              { name: 'Channel ID', value: result.channelId, inline: true },
              { name: 'Method', value: result.method || 'unknown', inline: true }
            );
            
          if (channelInfo) {
            embed.addFields(
              { name: 'Channel Name', value: channelInfo.author.name, inline: true },
              { name: 'Channel URL', value: channelInfo.author.url, inline: true },
              { name: 'Videos Found', value: channelInfo.videos.length.toString(), inline: true }
            );
          } else if (result.channelName) {
            embed.addFields({ name: 'Channel Name', value: result.channelName, inline: true });
          }
          
          await interaction.editReply({ embeds: [embed] });
        } else {
          const embed = new EmbedBuilder()
            .setTitle('❌ Channel Not Found')
            .setColor(0xFF0000)
            .setDescription(result.error || 'Could not resolve the YouTube handle')
            .addFields({ name: 'Input', value: handle, inline: true });
            
          await interaction.editReply({ embeds: [embed] });
        }
        return;
      }

      if (!interaction.guildId) {
        await interaction.reply({ content: 'This command can only be used in a guild.', ephemeral: true });
        return;
      }

      if (sub === 'subscribe') {
        const channelId = interaction.options.getString('channel_id', true);
        const discordChannel = interaction.options.getChannel('discord_channel', true);
        if (!('isTextBased' in discordChannel) || !discordChannel.isTextBased()) {
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
      } else if (sub === 'subscribe-handle') {
        const handle = interaction.options.getString('handle', true);
        const discordChannel = interaction.options.getChannel('discord_channel', true);
        
        if (!('isTextBased' in discordChannel) || !discordChannel.isTextBased()) {
          await interaction.reply({ content: 'Please select a text channel.', ephemeral: true });
          return;
        }

        await interaction.deferReply({ ephemeral: true });
        
        const result = await resolveYouTubeHandle(handle);
        
        if (result.channelId) {
          // Verify the channel works
          const channelInfo = await XMLTubeInfoFetcher(result.channelId);
          
          if (channelInfo) {
            await YouTubeSubscription.create({
              guildId: interaction.guildId,
              youtubeChannelId: result.channelId,
              discordChannelId: discordChannel.id,
              lastVideoId: null,
            });
            
            const embed = new EmbedBuilder()
              .setTitle('✅ Successfully Subscribed')
              .setColor(0x00FF00)
              .addFields(
                { name: 'Channel', value: channelInfo.author.name, inline: true },
                { name: 'Channel ID', value: result.channelId, inline: true },
                { name: 'Discord Channel', value: `<#${discordChannel.id}>`, inline: true }
              );
              
            await interaction.editReply({ embeds: [embed] });
          } else {
            await interaction.editReply({ content: `Found channel ID ${result.channelId} but couldn't verify it. The channel might not have any videos or RSS feed disabled.` });
          }
        } else {
          await interaction.editReply({ content: `Could not resolve handle "${handle}": ${result.error}` });
        }
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
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Command failed.', ephemeral: true });
      } else if (interaction.deferred) {
        await interaction.editReply({ content: 'Command failed.' });
      }
    }
  }
};
