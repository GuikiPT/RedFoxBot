import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { sessions } from "./play";

export const queue: Command = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current queue"),
  async execute(interaction: ChatInputCommandInteraction) {
    const session = sessions.get(interaction.guild!.id);
    if (!session || session.queue.length === 0) {
      await interaction.reply({ content: "Queue is empty", ephemeral: true });
      return;
    }
    const list = session.queue.slice(0, 10).map((t, i) => `${i + 1}. ${t.info.title}`).join("\n");
    await interaction.reply({ content: list, ephemeral: true });
  }
};
