import "dotenv/config";
import { env } from "./config/env";
import app from "./app";

app.listen(env.PORT, () => {
  console.log(`🚀 POS API running on http://localhost:${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});
