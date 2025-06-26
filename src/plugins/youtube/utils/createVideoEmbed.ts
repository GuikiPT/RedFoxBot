import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js';
import { VideoInfo, AuthorInfo } from '../../../utils/xmlTubeInfoFetcher';

export interface VideoEmbedOptions {
    video: VideoInfo;
    author: AuthorInfo;
    channelAvatar?: string;
}

export interface VideoEmbedResult {
    embed: EmbedBuilder;
    buttonRow: ActionRowBuilder<ButtonBuilder>;
}

/**
 * Creates a standardized video embed and button row for YouTube notifications
 */
export function createVideoEmbed(options: VideoEmbedOptions): VideoEmbedResult {
    const { video, author, channelAvatar } = options;

    // Truncate description if it's too long (Discord has a 4096 character limit for descriptions)
    const maxDescriptionLength = 300;
    let description = video.description || '';
    
    // If no description available, provide a default message
    if (!description.trim()) {
        description = `Watch this video from **${author.name}**`;
    }
    
    if (description.length > maxDescriptionLength) {
        description = description.substring(0, maxDescriptionLength) + '...';
    }

    // Create the video notification embed
    const embed = new EmbedBuilder()
        .setColor(0xff0000) // YouTube red
        .setTitle(video.title)
        .setURL(video.url)
        .setDescription(description)
        .setImage(video.thumbnails?.max_res_default || video.thumbnails?.hq_default || '')
        .addFields(
            { name: 'Channel', value: `[${author.name}](${author.url})`, inline: true },
            { name: 'Published', value: `<t:${video.published_at}:R>`, inline: true }
        );

    if (channelAvatar) {
        embed.setThumbnail(channelAvatar);
    }

    // Create action row with buttons
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Watch Video')
            .setEmoji({ name: '📽️' })
            .setURL(video.url),
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Visit Channel')
            .setEmoji({ name: '📺' })
            .setURL(author.url)
    );

    return { embed, buttonRow };
}
