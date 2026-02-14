import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "./lib/context";
import { appRouter } from "./routers/index";
import { auth } from "./lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { startPgBoss, stopPgBoss } from "./jobs/pgboss";
import { startCronJobs } from "./jobs/schedule";
import webhooks from "./routes/webhooks";
import gmailAuth from "./routes/gmail-auth";

const app = new Hono();

app.use(logger());
app.use("/*", cors({
  origin: process.env.CORS_ORIGIN || "",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// Gmail OAuth routes
app.route("/auth/gmail", gmailAuth);

// Webhook routes for Gmail push notifications
app.route("/webhooks", webhooks);

app.use("/trpc/*", trpcServer({
  router: appRouter,
  createContext: (_opts, context) => {
    return createContext({ context });
  },
}));

app.get("/", (c) => {
  return c.text("OK");
});

import { serve } from "@hono/node-server";

const port = Number(process.env.PORT) || 3002;

// Start background services
async function startServices() {
  try {
    // Start PG-Boss job queue
    await startPgBoss();
    
    // Start cron jobs for email sync
    startCronJobs();
    
    console.log("✅ All background services started");
  } catch (error) {
    console.error("❌ Failed to start background services:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await stopPgBoss();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await stopPgBoss();
  process.exit(0);
});

// Start server
serve({
  fetch: app.fetch,
  port,
}, async (info) => {
  console.log(`🚀 Server is running on http://localhost:${info.port}`);
  
  // Start background services after server is ready
  await startServices();
});
