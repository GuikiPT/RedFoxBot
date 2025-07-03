import { DataTypes, Model, Sequelize } from 'sequelize';

export class Reminder extends Model {
  public id!: number;
  public userId!: string;
  public originalMessage!: string;
  public enhancedTitle!: string | null;
  public enhancedDescription!: string | null;
  public reminderTime!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
  public isCompleted!: boolean;
  public channelId!: string;
  public guildId!: string | null;
  public notifyInDM!: boolean;
  public channelMention!: string | null;
  public detectedLanguage!: string | null;
}

export function initReminder(sequelize: Sequelize) {
  Reminder.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      enhancedTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      enhancedDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reminderTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      channelId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guildId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notifyInDM: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      channelMention: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      detectedLanguage: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'en',
      },
    },
    { 
      sequelize,
      tableName: 'reminders',
      timestamps: true,
    }
  );
}
