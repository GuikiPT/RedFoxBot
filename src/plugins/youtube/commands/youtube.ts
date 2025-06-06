import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';
import { Command } from '../../types';
import { YouTubeSubscription } from '../../../db/models';
import { resolveYouTubeHandle } from '../../../utils/youtubeHandleResolver';
import { XMLTubeInfoFetcher } from '../../../utils/xmlTubeInfoFetcher';

// Helper function to detect if input is a channel ID or handle
function isChannelId(input: string): boolean {
  // YouTube channel IDs are 24 characters starting with UC
  return /^UC[a-zA-Z0-9_-]{22}$/.test(input);
}

export const youtube: Command = {
  data: new SlashCommandBuilder()
    .setName('youtube')
    .setDescription('Manage YouTube notifications')
    .addSubcommand(sub =>
      sub
        .setName('subscribe')
        .setDescription('Subscribe to a YouTube channel')
        .addStringOption(o =>
          o.setName('channel').setDescription('YouTube channel ID, handle (@username), or URL').setRequired(true)
        )
        .addChannelOption(o =>
          o.setName('discord_channel').setDescription('Discord channel').setRequired(true)
        )
        .addRoleOption(o =>
          o.setName('mention_role').setDescription('Role to mention for new uploads').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('unsubscribe')
        .setDescription('Unsubscribe from a YouTube channel')
        .addStringOption(o =>
          o.setName('channel').setDescription('YouTube channel ID, handle (@username), or URL').setRequired(true)
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
        .setName('set-role')
        .setDescription('Set mention role for an existing subscription')
        .addStringOption(o =>
          o.setName('channel_id').setDescription('YouTube channel ID').setRequired(true)
        )
        .addRoleOption(o =>
          o.setName('mention_role').setDescription('Role to mention (leave empty to clear)').setRequired(false)
        )
    ) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    try {
      if (sub === 'lookup') {
        const handle = interaction.options.getString('handle', true);
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
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
        await interaction.reply({ content: 'This command can only be used in a guild.', flags: MessageFlags.Ephemeral });
        return;
      }

      if (sub === 'subscribe') {
        const channelInput = interaction.options.getString('channel', true);
        const discordChannel = interaction.options.getChannel('discord_channel', true);
        const mentionRole = interaction.options.getRole('mention_role');
        
        if (!('isTextBased' in discordChannel) || !discordChannel.isTextBased()) {
          await interaction.reply({ content: 'Please select a text channel.', flags: MessageFlags.Ephemeral });
          return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let channelId: string;
        let channelName: string | undefined;
        let channelUrl: string | undefined;

        // Check if input is already a channel ID
        if (isChannelId(channelInput)) {
          channelId = channelInput;
          
          // Try to get channel info to verify it works and get the name
          const channelInfo = await XMLTubeInfoFetcher(channelId);
          if (channelInfo) {
            channelName = channelInfo.author.name;
            channelUrl = channelInfo.author.url;
          }
        } else {
          // Input is a handle, resolve it to channel ID
          const result = await resolveYouTubeHandle(channelInput);
          
          if (!result.channelId) {
            await interaction.editReply({ content: `Could not resolve "${channelInput}": ${result.error}` });
            return;
          }
          
          channelId = result.channelId;
          
          // Verify the channel works and get info
          const channelInfo = await XMLTubeInfoFetcher(channelId);
          if (channelInfo) {
            channelName = channelInfo.author.name;
            channelUrl = channelInfo.author.url;
          } else {
            await interaction.editReply({ content: `Found channel ID ${channelId} but couldn't verify it. The channel might not have any videos or RSS feed disabled.` });
            return;
          }
        }

        // Create or update subscription
        const existing = await YouTubeSubscription.findOne({ where: { guildId: interaction.guildId, youtubeChannelId: channelId } });
        if (existing) {
          existing.discordChannelId = discordChannel.id;
          existing.mentionRoleId = mentionRole?.id ?? null;
          await existing.save();
        } else {
          await YouTubeSubscription.create({
            guildId: interaction.guildId,
            youtubeChannelId: channelId,
            discordChannelId: discordChannel.id,
            lastVideoId: null,
            mentionRoleId: mentionRole?.id ?? null,
          });
        }
        
        const embed = new EmbedBuilder()
          .setTitle('✅ Successfully Subscribed')
          .setColor(0x00FF00)
          .addFields(
            { name: 'Channel', value: channelName || 'Unknown', inline: true },
            { name: 'Channel ID', value: channelId, inline: true },
            { name: 'Discord Channel', value: `<#${discordChannel.id}>`, inline: true }
          );

        if (mentionRole) {
          embed.addFields({ name: 'Mention Role', value: `<@&${mentionRole.id}>`, inline: true });
        }

        const row = channelUrl
          ? new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel('View Channel')
                .setStyle(ButtonStyle.Link)
                .setURL(channelUrl)
            )
          : undefined;

        await interaction.editReply({ embeds: [embed], components: row ? [row] : [] });
      } else if (sub === 'unsubscribe') {
        const channelInput = interaction.options.getString('channel', true);
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let channelId: string;

        // Check if input is already a channel ID
        if (isChannelId(channelInput)) {
          channelId = channelInput;
        } else {
          // Input is a handle, resolve it to channel ID
          const result = await resolveYouTubeHandle(channelInput);
          
          if (!result.channelId) {
            await interaction.editReply({ content: `Could not resolve "${channelInput}": ${result.error}` });
            return;
          }
          
          channelId = result.channelId;
        }

        const channelInfo = await XMLTubeInfoFetcher(channelId);
        const channelName = channelInfo?.author.name;
        const channelUrl = channelInfo?.author.url;

        const count = await YouTubeSubscription.destroy({ where: { guildId: interaction.guildId, youtubeChannelId: channelId } });
        const embed = new EmbedBuilder();

        if (count > 0) {
          embed
            .setColor(0x00FF00)
            .setTitle('✅ Unsubscribed')
            .addFields(
              { name: 'Channel', value: channelName || 'Unknown', inline: true },
              { name: 'Channel ID', value: channelId, inline: true }
            );
        } else {
          embed
            .setColor(0xFF0000)
            .setTitle('❌ Subscription Not Found')
            .setDescription(`No subscription found for ${channelId}.`);
        }

        const row = channelUrl
          ? new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel('View Channel')
                .setStyle(ButtonStyle.Link)
                .setURL(channelUrl)
            )
          : undefined;

        await interaction.editReply({ embeds: [embed], components: row ? [row] : [] });
      } else if (sub === 'set-role') {
        const channelId = interaction.options.getString('channel_id', true);
        const role = interaction.options.getRole('mention_role');
        const subRecord = await YouTubeSubscription.findOne({ where: { guildId: interaction.guildId, youtubeChannelId: channelId } });
        const embed = new EmbedBuilder();

        if (!subRecord) {
          embed
            .setColor(0xFF0000)
            .setTitle('❌ Subscription Not Found')
            .setDescription(`No subscription found for ${channelId}.`);
        } else {
          subRecord.mentionRoleId = role?.id ?? null;
          await subRecord.save();
          embed
            .setColor(0x00FF00)
            .setTitle('✅ Updated Mention Role')
            .addFields(
              { name: 'Channel ID', value: channelId, inline: true },
              { name: 'Mention Role', value: role ? `<@&${role.id}>` : 'None', inline: true }
            );
        }

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      } else if (sub === 'list') {
        const subs = await YouTubeSubscription.findAll({ where: { guildId: interaction.guildId } });
        if (subs.length === 0) {
          await interaction.reply({ content: 'No subscriptions found.', flags: MessageFlags.Ephemeral });
        } else {
          const embed = new EmbedBuilder()
            .setTitle('📺 Current Subscriptions')
            .setColor(0x0099FF);

          for (const s of subs) {
            embed.addFields({
              name: s.youtubeChannelId,
              value: `<#${s.discordChannelId}>${s.mentionRoleId ? ` (role <@&${s.mentionRoleId}>)` : ''}`,
              inline: false
            });
          }

          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
      }
    } catch (err) {
      console.error('YouTube command failed:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Command failed.', flags: MessageFlags.Ephemeral });
      } else if (interaction.deferred) {
        await interaction.editReply({ content: 'Command failed.' });
      }
    }
  }
};
