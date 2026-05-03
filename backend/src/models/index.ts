import { sequelize } from "../config/database";
import { Expense } from "./expense.model";
import { User } from "./user.model";

User.hasMany(Expense, { foreignKey: "userId", as: "expenses" });
Expense.belongsTo(User, { foreignKey: "userId", as: "user" });

export { Expense, User };

export async function syncModels(): Promise<void> {
  await sequelize.sync({ alter: false });
}
