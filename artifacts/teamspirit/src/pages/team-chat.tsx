import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { TeamMessage } from "@/lib/types";
import { useTeamChatSocket } from "@/lib/useTeamChatSocket";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function TeamChat() {
  const [, params] = useRoute("/teams/:teamId/chat");
  const [, setLocation] = useLocation();
  const { teams, users, currentUser } = useAppStore();
  const qc = useQueryClient();

  const teamId = params?.teamId ?? "";
  const team = teams.find((t) => t.id === teamId);
  const isMember = !!team && team.memberIds.includes(currentUser.id);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const historyQ = useQuery({
    queryKey: ["teamChatMessages", teamId],
    queryFn: () => api<TeamMessage[]>(`/teams/${teamId}/chat/messages?limit=50`),
    enabled: !!teamId && isMember,
  });

  useEffect(() => {
    if (historyQ.data) setMessages(historyQ.data);
  }, [historyQ.data]);

  const knownIds = useMemo(() => new Set(messages.map((m) => m.id)), [messages]);

  const { status } = useTeamChatSocket(teamId, (payload) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === payload.id)) return prev;
      return [...prev, payload as TeamMessage];
    });
  });

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const threshold = 120;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    if (atBottom) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const sendMessage = async () => {
    const msg = text.trim();
    if (!msg) return;
    if (msg.length > 1000) { toast.error("訊息太長（最多 1000 字）"); return; }
    setSending(true);
    try {
      const created = await api<TeamMessage>(`/teams/${teamId}/chat/messages`, {
        method: "POST",
        body: JSON.stringify({ text: msg }),
      });
      setText("");
      if (!knownIds.has(created.id)) {
        await qc.invalidateQueries({ queryKey: ["teamChatMessages", teamId] });
      }
    } catch (e: any) {
      toast.error(e?.message || "送出失敗");
    } finally {
      setSending(false);
    }
  };

  if (!team) {
    return <div className="p-8 text-center">Team not found</div>;
  }

  if (!isMember) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card className="p-6 border-border bg-card/50 backdrop-blur text-center space-y-4">
          <div className="text-lg font-bold">你唔係球隊成員</div>
          <Button variant="outline" onClick={() => setLocation(`/teams/${team.id}`)}>返回球隊</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <Link href={`/teams/${team.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> 返回球隊
        </Link>
        <div className="text-sm font-bold tracking-widest uppercase">{team.name} · 聊天室</div>
        <div className="text-xs text-muted-foreground">
          {status === "connected" ? "已連線" : status === "forbidden" ? "無權限" : "重連中…"}
        </div>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur overflow-hidden">
        <div ref={listRef} className="h-[60vh] overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              暫時未有訊息
            </div>
          ) : (
            messages.map((m) => {
              const u = users.find((x) => x.id === m.userId);
              const mine = m.userId === currentUser.id;
              return (
                <div key={m.id} className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={u?.avatarUrl || `https://i.pravatar.cc/150?u=${m.userId}`} />
                      <AvatarFallback>{u?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                    {!mine && <div className="text-xs text-muted-foreground font-bold mb-1">{u?.name || m.userId}</div>}
                    <div className={`inline-block rounded-xl px-3 py-2 text-sm border ${mine ? "bg-primary/15 border-primary/25" : "bg-black/20 border-border/60"}`}>
                      {m.text}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {mine && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={currentUser.avatarUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`} />
                      <AvatarFallback>{currentUser.name?.[0] || "我"}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-4 space-y-3">
          <Textarea
            value={text}
            placeholder="輸入訊息…（Enter 送出，Shift+Enter 換行）"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={sending || status === "forbidden"}
          />
          <Button className="w-full font-bold tracking-widest uppercase" onClick={sendMessage} disabled={sending || status === "forbidden"}>
            <Send className="w-4 h-4 mr-2" /> {sending ? "送出中…" : "送出"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

