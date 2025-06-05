import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { sessions } from "./play";

export const nowplaying: Command = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show current track"),
  async execute(interaction: ChatInputCommandInteraction) {
    const session = sessions.get(interaction.guild!.id);
    if (!session || !session.player.track) {
      await interaction.reply({ content: "Nothing is playing", ephemeral: true });
      return;
    }
    const track = await session.player.node.rest.decode(session.player.track);
    await interaction.reply({ content: `Now playing: ${track?.info.title}`, ephemeral: true });
  }
};
