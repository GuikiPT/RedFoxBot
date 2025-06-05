import { Client } from "discord.js";
import { Shoukaku, Connectors, NodeOption } from "shoukaku";
import { config } from "../../config/config";

export function createShoukaku(client: Client): Shoukaku {
  const nodes: NodeOption[] = [
    {
      name: "main",
      url: `${config.LAVALINK_HOST}:${config.LAVALINK_PORT}`,
      auth: config.LAVALINK_PASSWORD,
      secure: config.LAVALINK_SECURE,
    },
  ];

  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes);

  shoukaku.on("ready", (name) => console.log(`Lavalink node ${name} connected`));
  shoukaku.on("error", (name, error) => console.error(`Lavalink node ${name} error`, error));

  return shoukaku;
}
