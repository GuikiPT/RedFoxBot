import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder,
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
            .setName('channel_id')
            .setDescription('YouTube channel ID')
            .setRequired(true),
        )
        .addRoleOption(o =>
          o
            .setName('mention_role')
            .setDescription('Role to mention (leave empty to clear)')
            .setRequired(false),
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
          const channelInfo = await XMLTubeInfoFetcher(result.channelId);

          const titleComponent = new TextDisplayBuilder().setContent('### ✅ YouTube Channel Found');
          let descContent = `**Input:** ${handle}\n**Channel ID:** ${result.channelId}\n**Method:** ${result.method || 'unknown'}`;
          if (channelInfo) {
            descContent += `\n**Channel Name:** ${channelInfo.author.name}\n**Channel URL:** ${channelInfo.author.url}\n**Videos Found:** ${channelInfo.videos.length}`;
          } else if (result.channelName) {
            descContent += `\n**Channel Name:** ${result.channelName}`;
          }
          const descComponent = new TextDisplayBuilder().setContent(descContent);

          const containerComponent = new ContainerBuilder()
            .addTextDisplayComponents(titleComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            )
            .addTextDisplayComponents(descComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            );

          await interaction.editReply({
            components: [containerComponent],
            flags: MessageFlags.IsComponentsV2,
          });
        } else {
          const titleComponent = new TextDisplayBuilder().setContent('### ❌ Channel Not Found');
          const descComponent = new TextDisplayBuilder().setContent(
            `${result.error || 'Could not resolve the YouTube handle'}\n\n**Input:** ${handle}`,
          );

          const containerComponent = new ContainerBuilder()
            .addTextDisplayComponents(titleComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            )
            .addTextDisplayComponents(descComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            );

          await interaction.editReply({
            components: [containerComponent],
            flags: MessageFlags.IsComponentsV2,
          });
        }
        return;
      }

      if (!interaction.guildId) {
        await interaction.reply({
          content: 'This command can only be used in a guild.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (sub === 'subscribe') {
        const channelInput = interaction.options.getString('channel', true);
        const discordChannel = interaction.options.getChannel('discord_channel', true);
        const mentionRole = interaction.options.getRole('mention_role');

        if (!('isTextBased' in discordChannel) || !discordChannel.isTextBased()) {
          await interaction.reply({
            content: 'Please select a text channel.',
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
            await interaction.editReply({
              content: `Could not resolve "${channelInput}": ${result.error}`,
            });
            return;
          }
          channelId = result.channelId;
          const channelInfo = await XMLTubeInfoFetcher(channelId);
          if (channelInfo) {
            channelName = channelInfo.author.name;
            channelUrl = channelInfo.author.url;
          } else {
            await interaction.editReply({
              content: `Found channel ID ${channelId} but couldn't verify it. The channel might not have any videos or RSS feed disabled.`,
            });
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

        const titleComponent = new TextDisplayBuilder().setContent('### ✅ Successfully Subscribed');
        let descContent = `**Channel:** ${channelName || 'Unknown'}\n**Channel ID:** ${channelId}\n**Discord Channel:** <#${discordChannel.id}>`;
        if (mentionRole) {
          descContent += `\n**Mention Role:** ${formatRoleMention(mentionRole.id, interaction.guildId)}`;
        }
        const descComponent = new TextDisplayBuilder().setContent(descContent);

        const containerComponent = new ContainerBuilder()
          .addTextDisplayComponents(titleComponent)
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
          )
          .addTextDisplayComponents(descComponent)
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
          );

        const components: (ContainerBuilder | ActionRowBuilder<ButtonBuilder>)[] = [containerComponent];
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
          components,
          flags: MessageFlags.IsComponentsV2,
        });
      } else if (sub === 'unsubscribe') {
        const channelInput = interaction.options.getString('channel', true);

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let channelId: string;
        if (isChannelId(channelInput)) {
          channelId = channelInput;
        } else {
          const result = await resolveYouTubeHandle(channelInput);
          if (!result.channelId) {
            await interaction.editReply({
              content: `Could not resolve "${channelInput}": ${result.error}`,
            });
            return;
          }
          channelId = result.channelId;
        }

        // Only delete if that channel matches the one saved for this guild
        const existing = await YouTubeSubscription.findOne({
          where: { guildId: interaction.guildId, youtubeChannelId: channelId },
        });
        if (existing) {
          await existing.destroy();
          const channelInfo = await XMLTubeInfoFetcher(channelId);
          const channelName = channelInfo?.author.name;
          const titleComponent = new TextDisplayBuilder().setContent('### ✅ Unsubscribed');
          const descComponent = new TextDisplayBuilder().setContent(
            `**Channel:** ${channelName || 'Unknown'}\n**Channel ID:** ${channelId}`,
          );
          const containerComponent = new ContainerBuilder()
            .addTextDisplayComponents(titleComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            )
            .addTextDisplayComponents(descComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            );
          await interaction.editReply({
            components: [containerComponent],
            flags: MessageFlags.IsComponentsV2,
          });
        } else {
          const titleComponent = new TextDisplayBuilder().setContent('### ❌ Subscription Not Found');
          const descComponent = new TextDisplayBuilder().setContent(
            `No subscription found for ${channelId}.`,
          );
          const containerComponent = new ContainerBuilder()
            .addTextDisplayComponents(titleComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            )
            .addTextDisplayComponents(descComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            );
          await interaction.editReply({
            components: [containerComponent],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      } else if (sub === 'set-role') {
        const channelId = interaction.options.getString('channel_id', true);
        const role = interaction.options.getRole('mention_role');

        // Ensure this matches the saved subscription
        const existing = await YouTubeSubscription.findOne({
          where: { guildId: interaction.guildId, youtubeChannelId: channelId },
        });

        let titleComponent: TextDisplayBuilder;
        let descComponent: TextDisplayBuilder;

        if (!existing) {
          titleComponent = new TextDisplayBuilder().setContent('### ❌ Subscription Not Found');
          descComponent = new TextDisplayBuilder().setContent(
            `No subscription found for ${channelId}.`,
          );
        } else {
          existing.mentionRoleId = role?.id ?? null;
          await existing.save();
          titleComponent = new TextDisplayBuilder().setContent('### ✅ Updated Mention Role');
          const mentionText = role ? formatRoleMention(role.id, interaction.guildId) : 'None';
          descComponent = new TextDisplayBuilder().setContent(
            `**Channel ID:** ${channelId}\n**Mention Role:** ${mentionText}`,
          );
        }

        const containerComponent = new ContainerBuilder()
          .addTextDisplayComponents(titleComponent)
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
          )
          .addTextDisplayComponents(descComponent)
          .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
          );

        await interaction.reply({
          components: [containerComponent],
          flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        });
      } else if (sub === 'list') {
        const existing = await YouTubeSubscription.findOne({
          where: { guildId: interaction.guildId },
        });
        if (!existing) {
          await interaction.reply({ content: 'No subscription found.', flags: MessageFlags.Ephemeral });
        } else {
          const channelInfo = await XMLTubeInfoFetcher(existing.youtubeChannelId);
          const channelName = channelInfo?.author.name || 'Unknown';
          const channelUrl = channelInfo?.author.url || '';
          const mentionText = existing.mentionRoleId
            ? formatRoleMention(existing.mentionRoleId, existing.guildId)
            : 'None';

          const titleComponent = new TextDisplayBuilder().setContent('### 📺 Current Subscription');
          let descContent = `**Channel Name:** ${channelName}\n**Channel ID:** ${existing.youtubeChannelId}`;
          if (channelUrl) descContent += `\n**Channel URL:** ${channelUrl}`;
          descContent += `\n**Discord Channel:** <#${existing.discordChannelId}>\n**Mention Role:** ${mentionText}`;

          const descComponent = new TextDisplayBuilder().setContent(descContent);

          const containerComponent = new ContainerBuilder()
            .addTextDisplayComponents(titleComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            )
            .addTextDisplayComponents(descComponent)
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            );

          await interaction.reply({
            components: [containerComponent],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          });
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
  },
};
