import { DataTypes, Model, Sequelize } from 'sequelize';

export class StarBoardConfig extends Model {
  public id!: number;
  public enabled !: boolean;
  public guildId!: string;
  public channelId!: string;
  public emoji!: string;
  public emojiThreshold!: number;
}

export function initStarBoardConfig(sequelize: Sequelize) {
  StarBoardConfig.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      guildId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      channelId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      emoji: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      emojiThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
      }
    },
    { sequelize }
  );
}
