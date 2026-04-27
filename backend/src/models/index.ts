import { sequelize } from "../config/database";
import { User } from "./user.model";

export { User };

export async function syncModels(): Promise<void> {
  await sequelize.sync({ alter: false });
}
