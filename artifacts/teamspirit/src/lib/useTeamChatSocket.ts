import { useEffect, useRef, useState } from "react";

type Status = "connecting" | "connected" | "reconnecting" | "disconnected" | "forbidden";

export function useTeamChatSocket(teamId: string, onMessage: (payload: any) => void) {
  const [status, setStatus] = useState<Status>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const forbiddenRef = useRef(false);

  useEffect(() => {
    retryRef.current = 0;
    forbiddenRef.current = false;
    setStatus("connecting");

    const connect = () => {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      const wsUrl = `${window.location.origin.replace(/^http/, "ws")}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
        setStatus("connected");
        ws.send(JSON.stringify({ type: "join", teamId }));
      };

      ws.onmessage = (ev) => {
        let msg: any;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (msg?.type === "message") onMessage(msg.payload);
        if (msg?.type === "error" && msg?.message === "forbidden") {
          forbiddenRef.current = true;
          setStatus("forbidden");
        }
      };

      const scheduleReconnect = () => {
        if (forbiddenRef.current) return;
        setStatus("reconnecting");
        const attempt = retryRef.current;
        const delay = Math.min(16000, 1000 * Math.pow(2, attempt));
        retryRef.current = attempt + 1;
        reconnectTimerRef.current = window.setTimeout(() => connect(), delay);
      };

      ws.onclose = () => scheduleReconnect();
      ws.onerror = () => scheduleReconnect();
    };

    connect();

    return () => {
      if (reconnectTimerRef.current != null) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
      setStatus("disconnected");
    };
  }, [teamId]);

  return { status };
}
