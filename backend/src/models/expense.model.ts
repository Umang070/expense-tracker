import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model
} from "sequelize";
import { sequelize } from "../config/database";

export class Expense extends Model<
  InferAttributes<Expense>,
  InferCreationAttributes<Expense, { omit: "id" | "createdAt" | "updatedAt" }>
> {
  declare id: number;
  declare userId: number;
  declare amount: number;
  declare category: string;
  declare paymentMethod: string;
  declare description: string | null;
  declare receiptName: string | null;
  declare date: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    receiptName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: "expenses",
    timestamps: true,
    indexes: [
      {
        fields: ["userId", "date"]
      }
    ]
  }
);
