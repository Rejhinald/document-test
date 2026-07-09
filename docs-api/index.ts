import app from "./server";
import { env } from "./config/env";

console.log(`🚀 docs-api listening on http://localhost:${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
