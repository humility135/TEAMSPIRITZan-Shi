import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { getUserIdFromCookieHeader } from "./lib/auth";
import { requireTeamMember } from "./lib/teamAuth";
import { joinTeam, leave } from "./lib/teamChatHub";

type StartResult = { port: number };

export function createServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const userIdBySocket = new WeakMap<WebSocket, string>();

  server.on("upgrade", (req, socket, head) => {
    const url = req.url ? new URL(req.url, "http://localhost") : null;
    if (!url || url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    const userId = getUserIdFromCookieHeader(req.headers.cookie);
    if (!userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      userIdBySocket.set(ws as WebSocket, userId);
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    ws.on("message", async (data) => {
      let msg: any;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "invalid_json" }));
        return;
      }

      if (msg?.type !== "join" || typeof msg?.teamId !== "string") {
        ws.send(JSON.stringify({ type: "error", message: "invalid_message" }));
        return;
      }

      const userId = userIdBySocket.get(ws as WebSocket);
      if (!userId) {
        ws.send(JSON.stringify({ type: "error", message: "unauthorized" }));
        return;
      }

      const ok = await requireTeamMember(msg.teamId, userId);
      if (!ok) {
        ws.send(JSON.stringify({ type: "error", message: "forbidden" }));
        return;
      }

      joinTeam(msg.teamId, ws as WebSocket);
      ws.send(JSON.stringify({ type: "joined", teamId: msg.teamId }));
    });

    ws.on("close", () => {
      leave(ws as WebSocket);
      userIdBySocket.delete(ws as WebSocket);
    });
  });

  const interval = setInterval(() => {
    for (const client of wss.clients) {
      try {
        client.ping();
      } catch {}
    }
  }, 30000);

  async function start(port: number): Promise<StartResult> {
    await new Promise<void>((resolve, reject) => {
      server.listen(port, "0.0.0.0", (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    const addr = server.address();
    const actualPort = typeof addr === "object" && addr ? addr.port : port;
    logger.info({ port: actualPort }, "Server listening on 0.0.0.0");
    return { port: actualPort };
  }

  async function stop(): Promise<void> {
    clearInterval(interval);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    wss.close();
  }

  return { server, start, stop };
}
