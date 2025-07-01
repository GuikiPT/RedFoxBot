import {
  Client,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
  GuildTextBasedChannel,
  ChannelType,
} from 'discord.js';
import { EventHandler } from '../../types';
import { StarBoardConfig } from '../../../db/models/StarBoardConfig';
import {
  findExistingStarboardRecord,
  findExistingStarboardMessage,
  updateStarboardMessage,
  validateStarboardConfig,
} from '../utils/starboardHelpers';

export const messageReactionRemove: EventHandler = {
  name: 'messageReactionRemove',
  once: false,
  execute: async (
    client: Client,
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) => {
    // Disabled: Once a message is posted to starboard, it stays there permanently
    // No reaction removal processing - messages are posted once and never removed or updated
    return;
  },
};
