import { app } from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { syncModels } from "./models";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await syncModels();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend server running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend server:", error);
  process.exit(1);
});
