import {
  Client,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { Reminder } from '../../../db/models';
import { EventHandler } from '../../types';
import { formatTimeRemaining } from '../../../utils/timeParser';

export const reminderListPaginationHandler: EventHandler = {
  name: 'interactionCreate',
  async execute(client: Client, interaction: ButtonInteraction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('remindlist_')) return;

    const [, pageStr, showAllStr] = interaction.customId.split('_');
    let page = parseInt(pageStr);
    const showAll = showAllStr === '1';

    if (isNaN(page)) page = 0;

    const whereClause: any = {
      userId: interaction.user.id
    };
    if (!showAll) {
      whereClause.isCompleted = false;
    }

    const reminders = await Reminder.findAll({
      where: whereClause,
      order: [['reminderTime', 'ASC']]
    });

    const remindersPerPage = 5;
    const totalPages = Math.ceil(reminders.length / remindersPerPage) || 1;
    page = Math.max(0, Math.min(page, totalPages - 1));

    const pageReminders = reminders.slice(page * remindersPerPage, (page + 1) * remindersPerPage);

    if (reminders.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xffaa00)
        .setTitle('📋 Your Reminders')
        .setDescription(showAll ? 'You have no reminders.' : 'You have no active reminders.')
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📋 Your Reminders')
      .setDescription(`Page ${page + 1} of ${totalPages}`)
      .setTimestamp();

    const now = new Date();

    for (const reminder of pageReminders) {
      const isPast = new Date(reminder.reminderTime) < now;
      const timeDisplay = isPast
        ? `⏰ <t:${Math.floor(new Date(reminder.reminderTime).getTime() / 1000)}:R> (Overdue)`
        : `⏰ <t:${Math.floor(new Date(reminder.reminderTime).getTime() / 1000)}:R>`;
      const status = reminder.isCompleted ? '✅ Completed' : isPast ? '🔴 Overdue' : '🟢 Active';
      const title = reminder.enhancedTitle || 'Reminder';
      const messageToShow = reminder.enhancedDescription || reminder.originalMessage;
      const truncatedMessage = messageToShow.length > 100 ? messageToShow.substring(0, 100) + '...' : messageToShow;
      const notificationInfo = reminder.notifyInDM ? '📩 DM' : `📢 ${reminder.channelMention || 'Channel'}`;
      const timeRemaining = formatTimeRemaining(reminder.reminderTime);

      embed.addFields({
        name: `${status} - ${title} (ID: ${reminder.id})`,
        value: `📝 ${truncatedMessage}\n${timeDisplay} (${timeRemaining})\n📍 ${notificationInfo}`,
        inline: false
      });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`remindlist_${page - 1}_${showAll ? 1 : 0}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 0),
      new ButtonBuilder()
        .setCustomId(`remindlist_${page + 1}_${showAll ? 1 : 0}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1)
    );

    await interaction.update({ embeds: [embed], components: [row] });
  }
};
