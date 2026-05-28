"use client";

/*
  SQL additions required:

  -- Add file columns to messages table:
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url  text;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type text;  -- 'image' | 'video'

  -- Create message-files storage bucket (public):
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('message-files', 'message-files', true)
  ON CONFLICT (id) DO NOTHING;

  CREATE POLICY "authenticated upload message files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'message-files');

  CREATE POLICY "public read message files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'message-files');

  -- messages table (if not yet created):
  CREATE TABLE IF NOT EXISTS messages (
    id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id   uuid REFERENCES offers(id) ON DELETE CASCADE,
    sender_id  uuid REFERENCES auth.users(id),
    content    text NOT NULL DEFAULT '',
    file_url   text,
    file_type  text,
    created_at timestamptz DEFAULT now()
  );
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "read own offer messages" ON messages FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = messages.offer_id
        AND (offers.marka_id = auth.uid() OR offers.yayinci_id = auth.uid())
    ));
  CREATE POLICY "insert own offer messages" ON messages FOR INSERT
    WITH CHECK (
      sender_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM offers WHERE offers.id = messages.offer_id
          AND (offers.marka_id = auth.uid() OR offers.yayinci_id = auth.uid())
      )
    );
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
*/

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type DbOfferStatus = "pending" | "accepted" | "rejected" | "completed";

type Conversation = {
  offerId:               string;
  otherPartyId:          string;
  otherPartyUsername:    string;
  otherPartyDisplayName: string;
  contentType:           string;
  offerStatus:           DbOfferStatus;
  lastMessage:           string;
  lastTime:              string;
  unread:                number;
};

type Message = {
  id:        string;
  offerId:   string;
  senderId:  string;
  content:   string;
  createdAt: string;
  fileUrl:   string | null;
  fileType:  string | null;
};

type PendingFile = {
  file:       File;
  previewUrl: string;
  fileType:   "image" | "video";
  storageUrl: string | null;
  uploading:  boolean;
  error:      string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const STATUS_CFG: Record<DbOfferStatus, { bg: string; text: string; dot: string; label: string }> = {
  pending:   { bg: "#EBF4FF", text: "#185FA5", dot: "#185FA5", label: "Beklemede"    },
  accepted:  { bg: "#ECFDF5", text: "#065F46", dot: "#10B981", label: "Kabul Edildi" },
  rejected:  { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", label: "Reddedildi"  },
  completed: { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF", label: "Tamamlandı"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function fmtTime(iso: string): string {
  const d   = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function fmtBytes(n: number): string {
  return n >= 1024 * 1024
    ? (n / 1024 / 1024).toFixed(1) + " MB"
    : (n / 1024).toFixed(0) + " KB";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";
  return (
    <div className={`${dim} rounded-xl flex items-center justify-center font-black text-white flex-shrink-0`} style={{ backgroundColor: "#042C53" }}>
      {initials(name)}
    </div>
  );
}

function StatusChip({ status }: { status: DbOfferStatus }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <div className="flex justify-center my-3">
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border"
        style={{ backgroundColor: s.bg, color: s.text, borderColor: s.dot + "33" }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
        {s.label}
      </span>
    </div>
  );
}

function ConvItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  const s = STATUS_CFG[conv.offerStatus] ?? STATUS_CFG.pending;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors rounded-xl"
      style={{ backgroundColor: active ? "#EBF4FF" : "transparent" }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <Avatar name={conv.otherPartyDisplayName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-sm font-bold truncate" style={{ color: active ? "#185FA5" : "#042C53" }}>
            @{conv.otherPartyUsername}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">{conv.lastTime}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mb-1.5">{conv.lastMessage}</p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5" style={{ backgroundColor: s.bg, color: s.text }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
            {s.label}
          </span>
          {conv.unread > 0 && (
            <span className="ml-auto flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ backgroundColor: "#185FA5" }}>
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId]     = useState<string | null>(null);
  const [convs, setConvs]                     = useState<Conversation[]>([]);
  const [messages, setMessages]               = useState<Record<string, Message[]>>({});
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [sending, setSending]                 = useState(false);
  const [input, setInput]                     = useState("");
  const [pendingFile, setPendingFile]         = useState<PendingFile | null>(null);
  const [mobileView, setMobileView]           = useState<"list" | "chat">("list");
  const bottomRef                             = useRef<HTMLDivElement>(null);
  const channelRef                            = useRef<RealtimeChannel | null>(null);
  const fileInputRef                          = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedOfferId]);

  // Revoke object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => { if (pendingFile) URL.revokeObjectURL(pendingFile.previewUrl); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConversations = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setCurrentUserId(user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: offerRows, error: offerErr } = await (supabase
      .from("offers")
      .select("id, marka_id, yayinci_id, content_type, status, created_at")
      .or(`marka_id.eq.${user.id},yayinci_id.eq.${user.id}`)
      .order("created_at", { ascending: false }) as any);

    if (offerErr || !offerRows?.length) { setLoading(false); return; }

    const otherIds = [...new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (offerRows as any[]).map((o) => o.marka_id === user.id ? o.yayinci_id : o.marka_id)
    )];
    const { data: profileRows } = await supabase
      .from("profiles").select("id, username, display_name").in("id", otherIds);

    const profileMap: Record<string, { username: string; display_name: string }> = {};
    for (const p of profileRows ?? []) profileMap[p.id] = p;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offerIds = (offerRows as any[]).map((o) => o.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: msgRows } = await (supabase
      .from("messages")
      .select("id, offer_id, sender_id, content, file_url, file_type, created_at")
      .in("offer_id", offerIds)
      .order("created_at", { ascending: true }) as any);

    const msgMap: Record<string, Message[]> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const m of (msgRows as any[]) ?? []) {
      if (!msgMap[m.offer_id]) msgMap[m.offer_id] = [];
      msgMap[m.offer_id].push({ id: m.id, offerId: m.offer_id, senderId: m.sender_id, content: m.content, createdAt: m.created_at, fileUrl: m.file_url ?? null, fileType: m.file_type ?? null });
    }
    setMessages(msgMap);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convList: Conversation[] = (offerRows as any[]).map((o) => {
      const otherId = o.marka_id === user.id ? o.yayinci_id : o.marka_id;
      const profile = profileMap[otherId];
      const msgs    = msgMap[o.id] ?? [];
      const lastMsg = msgs[msgs.length - 1];
      const preview = lastMsg
        ? (lastMsg.fileType === "image" ? "📷 Görsel" : lastMsg.fileType === "video" ? "🎬 Video" : lastMsg.content)
        : o.content_type;
      return {
        offerId:               o.id,
        otherPartyId:          otherId,
        otherPartyUsername:    profile?.username     ?? "kullanici",
        otherPartyDisplayName: profile?.display_name ?? "Kullanıcı",
        contentType:           o.content_type,
        offerStatus:           o.status as DbOfferStatus,
        lastMessage:           preview,
        lastTime:              lastMsg ? fmtTime(lastMsg.createdAt) : fmtTime(o.created_at),
        unread:                0,
      };
    });

    setConvs(convList);
    if (convList.length > 0) setSelectedOfferId(convList[0].offerId);
    setLoading(false);
  }, [router]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Realtime subscription per conversation
  useEffect(() => {
    if (!selectedOfferId || !currentUserId) return;
    const supabase = createClient();
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`messages-${selectedOfferId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `offer_id=eq.${selectedOfferId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: { new: any }) => {
          const m = payload.new;
          const newMsg: Message = { id: m.id, offerId: m.offer_id, senderId: m.sender_id, content: m.content, createdAt: m.created_at, fileUrl: m.file_url ?? null, fileType: m.file_type ?? null };
          setMessages((prev) => {
            const existing = prev[m.offer_id] ?? [];
            if (existing.some((x) => x.id === m.id)) return prev;
            return { ...prev, [m.offer_id]: [...existing, newMsg] };
          });
          const preview = m.file_type === "image" ? "📷 Görsel" : m.file_type === "video" ? "🎬 Video" : m.content;
          setConvs((prev) => prev.map((c) =>
            c.offerId === m.offer_id
              ? { ...c, lastMessage: preview, lastTime: fmtTime(m.created_at), unread: c.offerId === selectedOfferId ? 0 : c.unread + 1 }
              : c
          ));
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [selectedOfferId, currentUserId]);

  async function handleFileSelect(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Desteklenmeyen dosya türü. JPG, PNG, GIF veya MP4 yükleyebilirsin.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("Dosya boyutu 50 MB'tan büyük olamaz.");
      return;
    }

    const fileType   = file.type.startsWith("video/") ? "video" : "image";
    const previewUrl = URL.createObjectURL(file);
    setPendingFile({ file, previewUrl, fileType, storageUrl: null, uploading: true, error: null });

    if (!selectedOfferId || !currentUserId) return;

    const ext  = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${selectedOfferId}/${currentUserId}-${Date.now()}.${ext}`;

    const supabase = createClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("message-files")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error("[messages] file upload error:", uploadError);
      setPendingFile((prev) => prev ? { ...prev, uploading: false, error: "Yükleme başarısız. Tekrar dene." } : null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("message-files").getPublicUrl(uploadData.path);
    setPendingFile((prev) => prev ? { ...prev, uploading: false, storageUrl: publicUrl } : null);
  }

  function clearPendingFile() {
    if (pendingFile) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
  }

  function selectConv(offerId: string) {
    setSelectedOfferId(offerId);
    setMobileView("chat");
    setConvs((prev) => prev.map((c) => c.offerId === offerId ? { ...c, unread: 0 } : c));
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text && !pendingFile?.storageUrl) return;
    if (pendingFile?.uploading) return;
    if (!selectedOfferId || !currentUserId || sending) return;

    setSending(true);
    setInput("");

    const fileUrl  = pendingFile?.storageUrl ?? null;
    const fileType = pendingFile?.fileType   ?? null;
    clearPendingFile();

    // Optimistic insert
    const tempId  = `temp-${Date.now()}`;
    const tempMsg: Message = { id: tempId, offerId: selectedOfferId, senderId: currentUserId, content: text, createdAt: new Date().toISOString(), fileUrl, fileType };
    setMessages((prev) => ({ ...prev, [selectedOfferId]: [...(prev[selectedOfferId] ?? []), tempMsg] }));
    const preview = fileType === "image" ? "📷 Görsel" : fileType === "video" ? "🎬 Video" : text;
    setConvs((prev) => prev.map((c) => c.offerId === selectedOfferId ? { ...c, lastMessage: preview, lastTime: "Şimdi" } : c));

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from("messages")
      .insert({ offer_id: selectedOfferId, sender_id: currentUserId, content: text, file_url: fileUrl, file_type: fileType })
      .select().single() as any);

    if (!error && data) {
      setMessages((prev) => ({
        ...prev,
        [selectedOfferId]: (prev[selectedOfferId] ?? []).map((m) =>
          m.id === tempId
            ? { id: data.id, offerId: data.offer_id, senderId: data.sender_id, content: data.content, createdAt: data.created_at, fileUrl: data.file_url ?? null, fileType: data.file_type ?? null }
            : m
        ),
      }));
    } else if (error) {
      console.error("[messages] send error:", error);
      setMessages((prev) => ({ ...prev, [selectedOfferId]: (prev[selectedOfferId] ?? []).filter((m) => m.id !== tempId) }));
    }

    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const activeConv     = convs.find((c) => c.offerId === selectedOfferId) ?? null;
  const activeMessages = selectedOfferId ? (messages[selectedOfferId] ?? []) : [];
  const canSend        = (!!input.trim() || !!pendingFile?.storageUrl) && !pendingFile?.uploading && !sending;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#185FA5", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      <header className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</a>
          <a href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-[#185FA5] transition-colors">Dashboard</a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-6xl w-full mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-6" style={{ height: "calc(100vh - 64px)" }}>
        <div className="flex w-full h-full bg-white sm:rounded-2xl sm:border sm:border-gray-100 sm:shadow-sm overflow-hidden">

          {/* ── Conversation list ── */}
          <div className={`${mobileView === "chat" ? "hidden" : "flex"} md:flex flex-col w-full md:w-80 border-r border-gray-100 flex-shrink-0`}>
            <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-extrabold" style={{ color: "#042C53" }}>Mesajlar</h2>
              <p className="text-xs text-gray-400 mt-0.5">{convs.length} konuşma</p>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {convs.length === 0 ? (
                <div className="py-16 text-center px-4">
                  <p className="text-3xl mb-3">💬</p>
                  <p className="text-sm font-semibold text-gray-500">Henüz konuşma yok.</p>
                  <p className="text-xs text-gray-400 mt-1">Bir yayıncıya teklif gönderince burada görünür.</p>
                </div>
              ) : (
                convs.map((conv) => (
                  <ConvItem key={conv.offerId} conv={conv} active={selectedOfferId === conv.offerId} onClick={() => selectConv(conv.offerId)} />
                ))
              )}
            </div>
          </div>

          {/* ── Chat window ── */}
          <div className={`${mobileView === "list" ? "hidden" : "flex"} md:flex flex-1 flex-col min-w-0`}>

            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl mb-3">💬</p>
                  <p className="text-sm text-gray-400">Bir konuşma seç</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
                  <button className="md:hidden text-gray-400 hover:text-gray-700 p-1 -ml-1 rounded-lg" onClick={() => setMobileView("list")}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <Avatar name={activeConv.otherPartyDisplayName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold" style={{ color: "#042C53" }}>@{activeConv.otherPartyUsername}</p>
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}>
                        {activeConv.contentType.split(",")[0]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{activeConv.otherPartyDisplayName}</p>
                  </div>
                  <a href={`/profile/${activeConv.otherPartyUsername}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0" style={{ borderColor: "#E6F1FB", color: "#185FA5" }}>
                    Profili Gör
                  </a>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-1">
                  <StatusChip status={activeConv.offerStatus} />

                  {activeMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-12 text-center">
                      <div>
                        <p className="text-2xl mb-2">👋</p>
                        <p className="text-sm text-gray-400">Henüz mesaj yok. İlk mesajı sen gönder!</p>
                      </div>
                    </div>
                  ) : (
                    activeMessages.map((msg) => {
                      const isSent = msg.senderId === currentUserId;
                      return (
                        <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1`}>
                          <div className="flex flex-col gap-1" style={{ maxWidth: "70%" }}>

                            {/* Text bubble */}
                            {msg.content && (
                              <div
                                className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                                style={isSent
                                  ? { backgroundColor: "#185FA5", color: "white", borderBottomRightRadius: "4px" }
                                  : { backgroundColor: "#F3F4F6", color: "#111827", borderBottomLeftRadius: "4px" }}
                              >
                                {msg.content}
                              </div>
                            )}

                            {/* Image */}
                            {msg.fileUrl && msg.fileType === "image" && (
                              <img
                                src={msg.fileUrl}
                                alt="Görsel"
                                className="rounded-2xl max-w-full cursor-pointer object-cover"
                                style={{ maxHeight: "300px" }}
                                onClick={() => window.open(msg.fileUrl!, "_blank")}
                              />
                            )}

                            {/* Video */}
                            {msg.fileUrl && msg.fileType === "video" && (
                              <video
                                src={msg.fileUrl}
                                controls
                                className="rounded-2xl max-w-full"
                                style={{ maxHeight: "300px" }}
                              />
                            )}

                            <span className={`text-xs text-gray-400 ${isSent ? "text-right" : "text-left"} px-1`}>
                              {fmtTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">

                  {/* File preview */}
                  {pendingFile && (
                    <div className="mb-3 rounded-xl border border-gray-200 p-3 bg-gray-50 flex items-start gap-3">
                      {pendingFile.fileType === "image" ? (
                        <img src={pendingFile.previewUrl} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-7 h-7 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{pendingFile.file.name}</p>
                        <p className="text-xs text-gray-400">{fmtBytes(pendingFile.file.size)}</p>
                        {pendingFile.uploading && (
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#185FA5" }}>
                            <span className="inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#185FA5", borderTopColor: "transparent" }} />
                            Yükleniyor…
                          </p>
                        )}
                        {pendingFile.error && <p className="text-xs text-red-500 mt-1">{pendingFile.error}</p>}
                        {!pendingFile.uploading && !pendingFile.error && pendingFile.storageUrl && (
                          <p className="text-xs text-green-600 mt-1 font-medium">✓ Hazır</p>
                        )}
                      </div>
                      <button onClick={clearPendingFile} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,video/mp4"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f);
                        e.target.value = "";
                      }}
                    />

                    {/* Paperclip button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || !!pendingFile}
                      title="Dosya ekle (JPG, PNG, GIF, MP4 — maks. 50 MB)"
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: "#6B7280" }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>

                    {/* Text input */}
                    <textarea
                      rows={1}
                      placeholder="Mesaj yaz…"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                      }}
                      onKeyDown={handleKey}
                      disabled={sending}
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 resize-none overflow-hidden disabled:opacity-60"
                      style={{ minHeight: "42px" }}
                    />

                    {/* Send button */}
                    <button
                      onClick={sendMessage}
                      disabled={!canSend}
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#185FA5" }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 px-1">Enter ile gönder · Shift+Enter ile yeni satır</p>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
