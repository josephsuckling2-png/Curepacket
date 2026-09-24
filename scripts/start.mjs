import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", cwd: root, env: process.env });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

const external = process.env.RENDER_EXTERNAL_URL?.trim().replace(/\/$/, "");
if (external) {
  if (!process.env.AUTH_URL?.trim()) process.env.AUTH_URL = external;
  if (!process.env.APP_URL?.trim()) process.env.APP_URL = external;
  if (!process.env.NEXT_PUBLIC_APP_URL?.trim()) process.env.NEXT_PUBLIC_APP_URL = external;
}

if (!process.env.AUTH_TRUST_HOST?.trim()) {
  process.env.AUTH_TRUST_HOST = "true";
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (!process.env.AUTH_SECRET) {
  console.error("AUTH_SECRET is required.");
  process.exit(1);
}

await run(process.execPath, [path.join(root, "scripts", "migrate.mjs")]);

const seedFlag = (process.env.SEED_DEMO ?? "").trim().toLowerCase();
if (seedFlag === "true" || seedFlag === "1" || seedFlag === "yes") {
  console.log("SEED_DEMO is enabled — creating or refreshing the demo agency login.");
  await run(path.join(root, "node_modules", ".bin", "tsx"), ["prisma/seed.ts"]);
} else {
  console.log("SEED_DEMO is not true — skipping the demo agency. Create an account at /register.");
}

const port = process.env.PORT?.trim() || "3000";
console.log(`Starting CurePacket on 0.0.0.0:${port}`);

const server = spawn(
  path.join(root, "node_modules", ".bin", "next"),
  ["start", "-H", "0.0.0.0", "-p", port],
  { stdio: "inherit", cwd: root, env: process.env },
);

function shutdown(signal) {
  server.kill(signal);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.on("exit", (code) => {
  process.exit(code ?? 0);
});
