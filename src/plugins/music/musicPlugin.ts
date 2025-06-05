import { Client } from "discord.js";
import { Plugin } from "../types";
import { play } from "./commands/play";
import { skip } from "./commands/skip";
import { stop } from "./commands/stop";
import { pause } from "./commands/pause";
import { resume } from "./commands/resume";
import { queue } from "./commands/queue";
import { nowplaying } from "./commands/nowplaying";
import { createShoukaku } from "./shoukaku";

export const musicPlugin: Plugin = {
  name: "music",
  description: "Music playback using Lavalink",
  authors: ["GuikiPT"],
  commands: [play, skip, stop, pause, resume, queue, nowplaying],
  events: [],
  load: async (client: Client) => {
    const shoukaku = createShoukaku(client);
    (client as any).shoukaku = shoukaku;
    console.log("Music plugin loaded - Lavalink ready");
  }
};
