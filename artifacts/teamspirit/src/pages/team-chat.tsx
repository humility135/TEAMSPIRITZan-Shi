import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ImageUp, Send } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const nearBottomRef = useRef(true);

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
    if (!nearBottomRef.current) {
      setHasNew(true);
      setNewCount((c) => c + 1);
    }
    setMessages((prev) => {
      if (prev.some((m) => m.id === payload.id)) return prev;
      return [...prev, payload as TeamMessage];
    });
  });

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const threshold = 120;

    const update = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      nearBottomRef.current = atBottom;
      if (atBottom) {
        setHasNew(false);
        setNewCount(0);
      }
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setHasNew(false);
    setNewCount(0);
  };

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
        body: JSON.stringify({ kind: "text", text: msg }),
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

  const uploadImage = async (file: File) => {
    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) { toast.error("只支援 PNG/JPG/GIF/WEBP"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("圖片太大（最多 2MB）"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/teams/${teamId}/chat/uploads`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) throw new Error(data?.error || "Upload failed");

      const created = await api<TeamMessage>(`/teams/${teamId}/chat/messages`, {
        method: "POST",
        body: JSON.stringify({ kind: "image", imageUrl: data.url }),
      });
      if (!knownIds.has(created.id)) {
        await qc.invalidateQueries({ queryKey: ["teamChatMessages", teamId] });
      }
    } catch (e: any) {
      toast.error(e?.message || "上傳失敗");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const linkify = (input: string) => {
    const re = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?)/g;
    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const m of input.matchAll(re)) {
      const raw = m[0];
      const idx = m.index ?? 0;
      if (idx > last) parts.push(input.slice(last, idx));
      let urlText = raw;
      while (/[)\].,!?:;]+$/.test(urlText)) urlText = urlText.slice(0, -1);
      const href = /^https?:\/\//i.test(urlText) ? urlText : `https://${urlText.replace(/^www\./i, "www.")}`;
      parts.push(
        <a key={`${idx}-${urlText}`} href={href} target="_blank" rel="noreferrer" className="underline break-all hover:opacity-80">
          {urlText}
        </a>,
      );
      last = idx + raw.length;
    }
    if (last < input.length) parts.push(input.slice(last));
    return parts;
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
        <div className="relative">
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
                      {m.kind === "image" && m.imageUrl ? (
                        <a href={m.imageUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={m.imageUrl}
                            alt=""
                            width={280}
                            height={180}
                            loading="lazy"
                            className="max-w-[280px] max-h-[320px] w-full object-contain rounded-lg border border-border/60"
                          />
                        </a>
                      ) : (
                        <span className="whitespace-pre-wrap break-words">{linkify(m.text)}</span>
                      )}
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
          {hasNew && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Button
                size="sm"
                className="font-bold tracking-widest uppercase shadow-lg"
                aria-label="跳到最新訊息"
                onClick={scrollToBottom}
              >
                <ArrowDown className="w-4 h-4 mr-2" /> 新訊息{newCount > 0 ? ` (${newCount})` : ""}
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4 space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="上傳圖片"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage(f);
            }}
          />
          <Textarea
            value={text}
            placeholder="輸入訊息…（Enter 送出，Shift+Enter 換行）"
            aria-label="輸入訊息"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={sending || uploading || status === "forbidden"}
          />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full font-bold tracking-widest uppercase" onClick={() => fileRef.current?.click()} disabled={sending || uploading || status === "forbidden"}>
              <ImageUp className="w-4 h-4 mr-2" /> {uploading ? "上傳中…" : "傳圖"}
            </Button>
            <Button className="w-full font-bold tracking-widest uppercase" onClick={sendMessage} disabled={sending || uploading || status === "forbidden"}>
              <Send className="w-4 h-4 mr-2" /> {sending ? "送出中…" : "送出"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
