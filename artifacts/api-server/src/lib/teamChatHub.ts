import { WebSocket } from "ws";

const connectionsByTeamId = new Map<string, Set<WebSocket>>();
const teamIdBySocket = new WeakMap<WebSocket, string>();

export function joinTeam(teamId: string, ws: WebSocket) {
  const prev = teamIdBySocket.get(ws);
  if (prev && prev !== teamId) {
    const prevSet = connectionsByTeamId.get(prev);
    if (prevSet) {
      prevSet.delete(ws);
      if (prevSet.size === 0) connectionsByTeamId.delete(prev);
    }
  }
  teamIdBySocket.set(ws, teamId);
  const set = connectionsByTeamId.get(teamId) ?? new Set<WebSocket>();
  set.add(ws);
  connectionsByTeamId.set(teamId, set);
}

export function leave(ws: WebSocket) {
  const teamId = teamIdBySocket.get(ws);
  if (!teamId) return;
  const set = connectionsByTeamId.get(teamId);
  if (set) {
    set.delete(ws);
    if (set.size === 0) connectionsByTeamId.delete(teamId);
  }
  teamIdBySocket.delete(ws);
}

export function broadcast(teamId: string, data: string) {
  const set = connectionsByTeamId.get(teamId);
  if (!set) return;
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}
