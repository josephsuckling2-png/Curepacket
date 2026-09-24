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

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required for the monitoring cron.");
  process.exit(1);
}

await run(process.execPath, [path.join(root, "scripts", "migrate.mjs")]);
await run(path.join(root, "node_modules", ".bin", "tsx"), ["scripts/monitor-cron.ts"]);
