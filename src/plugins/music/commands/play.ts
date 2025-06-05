import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { Track } from "shoukaku";

interface MusicSession {
  queue: Track[];
  player: any;
  channelId: string;
}

declare module 'discord.js' {
  interface Client {
    shoukaku?: any;
  }
}

export const sessions = new Map<string, MusicSession>();

async function playNext(guildId: string) {
  const session = sessions.get(guildId);
  if (!session) return;
  const next = session.queue.shift();
  if (!next) {
    await session.player.stopTrack();
    return;
  }
  await session.player.playTrack({ track: { encoded: next.encoded } });
}

export const play: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("Search query or URL")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString("query", true);
    const member = interaction.member as any;
    const voice = member.voice?.channel;

    if (!voice) {
      await interaction.reply({ content: "You must be in a voice channel", ephemeral: true });
      return;
    }

    const shoukaku = (interaction.client as any).shoukaku;
    if (!shoukaku) {
      await interaction.reply({ content: "Shoukaku not initialized", ephemeral: true });
      return;
    }

    const node = shoukaku.getIdealNode();
    if (!node) {
      await interaction.reply({ content: "No Lavalink nodes available", ephemeral: true });
      return;
    }

    let session = sessions.get(interaction.guild!.id);
    if (!session) {
      const player = await shoukaku.joinVoiceChannel({
        guildId: interaction.guild!.id,
        shardId: interaction.guild!.shardId,
        channelId: voice.id,
      });
      session = { queue: [], player, channelId: voice.id };
      sessions.set(interaction.guild!.id, session);
      session.player.on("playerUpdate", () => {});
      session.player.on("event", async (event: any) => {
        if (event.type === "TrackEndEvent") {
          await playNext(interaction.guild!.id);
        }
      });
    }

    const result = await node.rest.resolve(query);
    if (!result || result.loadType === "empty") {
      await interaction.reply({ content: "No results", ephemeral: true });
      return;
    }

    if (result.loadType === "playlist") {
      session.queue.push(...result.data.tracks);
    } else if (result.data) {
      session.queue.push(result.data as Track);
    }

    await interaction.reply({ content: `Added to queue: ${query}`, ephemeral: true });

    if (!session.player.track) {
      await playNext(interaction.guild!.id);
    }
  }
};
