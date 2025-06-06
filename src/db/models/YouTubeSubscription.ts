import { DataTypes, Model, Sequelize } from 'sequelize';

export class YouTubeSubscription extends Model {
  public id!: number;
  public guildId!: string;
  public discordChannelId!: string;
  public youtubeChannelId!: string;
  public lastVideoId!: string | null;
}

export function initYouTubeSubscription(sequelize: Sequelize) {
  YouTubeSubscription.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      guildId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      discordChannelId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      youtubeChannelId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastVideoId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    { sequelize }
  );
}
