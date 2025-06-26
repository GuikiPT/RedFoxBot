import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { SubcommandHandler } from './types';
import { YouTubeSubscription } from '../../../../db/models';
import { resolveYouTubeHandle } from '../../../../utils/youtubeHandleResolver';
import { XMLTubeInfoFetcher } from '../../../../utils/xmlTubeInfoFetcher';
import { getYouTubeChannelAvatar } from '../../../../utils/youtubeChannelAvatar';

// Helper function to detect if input is a channel ID or handle
function isChannelId(input: string): boolean {
  // YouTube channel IDs are 24 characters starting with UC
  return /^UC[a-zA-Z0-9_-]{22}$/.test(input);
}

// Helper function to format role mentions correctly
function formatRoleMention(roleId: string, guildId: string): string {
  if (roleId === guildId) {
    // @everyone role
    return '@everyone';
  } else {
    // Regular role
    return `<@&${roleId}>`;
  }
}

export const subscribeSubcommand: SubcommandHandler = {
  name: 'subscribe',
  async execute(interaction: ChatInputCommandInteraction) {
    const channelInput = interaction.options.getString('channel', true);
    const discordChannel = interaction.options.getChannel('discord_channel', true);
    const mentionRole = interaction.options.getRole('mention_role');

    if (!('isTextBased' in discordChannel) || !discordChannel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Error')
        .setDescription('Please select a text channel.')
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let channelId: string;
    let channelName: string | undefined;
    let channelUrl: string | undefined;

    if (isChannelId(channelInput)) {
      channelId = channelInput;
      const channelInfo = await XMLTubeInfoFetcher(channelId);
      if (channelInfo) {
        channelName = channelInfo.author.name;
        channelUrl = channelInfo.author.url;
      }
    } else {
      const result = await resolveYouTubeHandle(channelInput);
      if (!result.channelId) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Error')
          .setDescription(`Could not resolve "${channelInput}": ${result.error}`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }
      channelId = result.channelId;
      const channelInfo = await XMLTubeInfoFetcher(channelId);
      if (channelInfo) {
        channelName = channelInfo.author.name;
        channelUrl = channelInfo.author.url;
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Error')
          .setDescription(`Found channel ID ${channelId} but couldn't verify it. The channel might not have any videos or RSS feed disabled.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }

    // Only one subscription per guild: find by guildId only
    const existing = await YouTubeSubscription.findOne({
      where: { guildId: interaction.guildId },
    });
    if (existing) {
      existing.youtubeChannelId = channelId;
      existing.discordChannelId = discordChannel.id;
      existing.mentionRoleId = mentionRole?.id ?? null;
      existing.lastVideoId = null; // reset so next check picks latest
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

    // Get channel avatar
    const channelAvatar = await getYouTubeChannelAvatar(channelId);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Successfully Subscribed')
      .addFields(
        { name: 'Channel', value: channelName || 'Unknown', inline: true },
        { name: 'Channel ID', value: channelId, inline: true },
        { name: 'Discord Channel', value: `<#${discordChannel.id}>`, inline: true }
      )
      .setTimestamp();

    if (mentionRole) {
      embed.addFields(
        { name: 'Mention Role', value: formatRoleMention(mentionRole.id, interaction.guildId!), inline: true }
      );
    }

    if (channelUrl) {
      embed.setURL(channelUrl);
    }

    if (channelAvatar) {
      embed.setThumbnail(channelAvatar);
    }

    const components: ActionRowBuilder<ButtonBuilder>[] = [];
    if (channelUrl) {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('View Channel')
          .setStyle(ButtonStyle.Link)
          .setURL(channelUrl)
          .setEmoji({ name: '📺' }),
      );
      components.push(buttonRow);
    }

    await interaction.editReply({
      embeds: [embed],
      components: components.length > 0 ? components : undefined,
    });
  },
};
