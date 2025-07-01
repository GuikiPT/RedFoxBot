import { DataTypes, Model, Sequelize } from 'sequelize';

export class StarBoardMessage extends Model {
  public id!: number;
  public guildId!: string;
  public originalMessageId!: string;
  public starboardMessageId!: string;
  public channelId!: string;
  public starboardChannelId!: string;
}

export function initStarBoardMessage(sequelize: Sequelize) {
  StarBoardMessage.init(
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
      originalMessageId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      starboardMessageId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      channelId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      starboardChannelId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    { 
      sequelize,
      indexes: [
        {
          unique: true,
          fields: ['guildId', 'originalMessageId']
        }
      ]
    }
  );
}
