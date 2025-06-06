import { DataTypes, Model, Sequelize } from 'sequelize';

export class Guild extends Model {
  public id!: string;
  public name!: string;
}

export function initGuild(sequelize: Sequelize) {
  Guild.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    { sequelize }
  );
}
