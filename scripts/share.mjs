import { spawn } from "node:child_process";
import crypto from "node:crypto";

function spawnProc(label, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...extraEnv },
    shell: process.platform === "win32",
  });

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  child.stdout.on("data", (d) => process.stdout.write(`[${label}] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[${label}] ${d}`));

  return child;
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

function waitForOutput(child, match) {
  return new Promise((resolve) => {
    const onData = (d) => {
      const s = String(d);
      const m = s.match(match);
      if (m) {
        cleanup();
        resolve(m[0]);
      }
    };
    const cleanup = () => {
      child.stdout.off("data", onData);
      child.stderr.off("data", onData);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
  });
}

const SESSION_SECRET = process.env.SESSION_SECRET ?? crypto.randomBytes(32).toString("hex");

const children = [];
function cleanup() {
  for (const c of children) {
    try {
      if (process.platform === "win32") c.kill();
      else c.kill("SIGTERM");
    } catch {}
  }
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});
process.on("exit", () => {
  cleanup();
});

async function main() {
  const apiBuild = spawnProc(
    "api-build",
    "pnpm",
    ["--filter", "@workspace/api-server", "run", "build"],
  );
  children.push(apiBuild);
  await waitForExit(apiBuild);

  const api = spawnProc(
    "api",
    "pnpm",
    ["--filter", "@workspace/api-server", "run", "start"],
    { PORT: "3000", NODE_ENV: "production", SESSION_SECRET },
  );
  children.push(api);

  const web = spawnProc(
    "web",
    "pnpm",
    ["--filter", "@workspace/teamspirit", "run", "dev"],
    { PORT: "5173", NODE_ENV: "development" },
  );
  children.push(web);

  const cloudflared = spawnProc(
    "tunnel",
    "cloudflared",
    ["tunnel", "--url", "http://localhost:5173", "--no-autoupdate"],
  );
  children.push(cloudflared);

  try {
    const url = await new Promise((resolve, reject) => {
      let settled = false;
      const match = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

      const onData = (d) => {
        const s = String(d);
        const m = s.match(match);
        if (m && !settled) {
          settled = true;
          cleanupListeners();
          resolve(m[0]);
        }
      };

      const onError = (err) => {
        if (settled) return;
        settled = true;
        cleanupListeners();
        reject(err);
      };

      const onExit = (code) => {
        if (settled) return;
        settled = true;
        cleanupListeners();
        reject(new Error(`cloudflared exited with code ${code}`));
      };

      const cleanupListeners = () => {
        cloudflared.stdout.off("data", onData);
        cloudflared.stderr.off("data", onData);
        cloudflared.off("error", onError);
        cloudflared.off("exit", onExit);
      };

      cloudflared.stdout.on("data", onData);
      cloudflared.stderr.on("data", onData);
      cloudflared.on("error", onError);
      cloudflared.on("exit", onExit);
    });

    process.stdout.write(`\nShare URL: ${url}\n`);
    await waitForExit(cloudflared);
  } catch {
    process.stderr.write(
      "\n找不到 cloudflared。\n\nWindows 建議安裝：\n  winget install -e --id Cloudflare.cloudflared\n\n裝完再重新跑：\n  pnpm share\n\n",
    );
    cleanup();
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`\nshare failed: ${err?.message ?? String(err)}\n`);
  cleanup();
  process.exit(1);
});
