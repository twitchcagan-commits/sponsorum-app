"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageKind = "sent" | "received" | "status";
type OfferStatus = "Teklif Gönderildi" | "Kabul Edildi" | "Ödeme Bekleniyor";

type Message = {
  id: number;
  kind: MessageKind;
  text?: string;
  status?: OfferStatus;
  time: string;
};

type Conversation = {
  username: string;
  displayName: string;
  initials: string;
  niche: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  offerStatus: OfferStatus;
  messages: Message[];
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const CONVERSATIONS: Conversation[] = [
  {
    username: "gamerturk",
    displayName: "Burak K.",
    initials: "BK",
    niche: "Oyun",
    lastMessage: "Harika! Brifing dokümanını en kısa sürede…",
    lastTime: "11:02",
    unread: 0,
    online: true,
    offerStatus: "Kabul Edildi",
    messages: [
      { id: 1, kind: "received", text: "Merhaba, teklifinizi inceledim. Ürününüz hakkında biraz daha bilgi alabilir miyim?", time: "10:30" },
      { id: 2, kind: "sent",     text: "Tabii ki! Yeni çıkan FPS oyunumuzun tanıtımını yapmak istiyoruz. Hedef kitleniz bizim için çok uygun.", time: "10:32" },
      { id: 3, kind: "received", text: "Anladım, bütçe ve içerik detaylarına bakayım.", time: "10:35" },
      { id: 4, kind: "status",   status: "Teklif Gönderildi", time: "10:40" },
      { id: 5, kind: "received", text: "İnceledim, fiyat konusunda anlaşabiliriz. Kabul ediyorum 👍", time: "11:00" },
      { id: 6, kind: "status",   status: "Kabul Edildi", time: "11:00" },
      { id: 7, kind: "sent",     text: "Harika! Brifing dokümanını en kısa sürede göndereceğim.", time: "11:02" },
    ],
  },
  {
    username: "futboleditr",
    displayName: "Emre S.",
    initials: "ES",
    niche: "Futbol",
    lastMessage: "Bir sorum vardı, içeriğin süresi ne kadar olmalı?",
    lastTime: "Dün",
    unread: 2,
    online: false,
    offerStatus: "Teklif Gönderildi",
    messages: [
      { id: 1, kind: "sent",     text: "Merhaba, kampanyamız için sizinle çalışmak isteriz. Futbol içeriklerinizi takip ediyoruz, kitleniz markamıza çok uygun.", time: "Dün 15:20" },
      { id: 2, kind: "received", text: "Merhaba! İlginiz için teşekkürler. Detayları paylaşır mısınız?", time: "Dün 15:45" },
      { id: 3, kind: "sent",     text: "Tabii. Instagram Reels formatında, yeni sezon kampanyamız için bir içerik istiyoruz.", time: "Dün 16:00" },
      { id: 4, kind: "status",   status: "Teklif Gönderildi", time: "Dün 16:05" },
      { id: 5, kind: "received", text: "Teşekkürler, inceleyip döneceğim.", time: "Dün 16:30" },
      { id: 6, kind: "received", text: "Bir sorum vardı, içeriğin süresi ne kadar olmalı?", time: "Dün 16:31" },
    ],
  },
];

// ─── Status chip config ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<OfferStatus, { bg: string; text: string; dot: string; label: string }> = {
  "Teklif Gönderildi":  { bg: "#EBF4FF", text: "#185FA5", dot: "#185FA5",  label: "Teklif Gönderildi" },
  "Kabul Edildi":       { bg: "#ECFDF5", text: "#065F46", dot: "#10B981",  label: "Kabul Edildi" },
  "Ödeme Bekleniyor":   { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B",  label: "Ödeme Bekleniyor" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ initials, online, size = "md" }: { initials: string; online: boolean; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${dim} rounded-xl flex items-center justify-center font-black text-white`} style={{ backgroundColor: "#042C53" }}>
        {initials}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-emerald-400" />
      )}
    </div>
  );
}

function StatusChip({ status }: { status: OfferStatus }) {
  const s = STATUS_STYLES[status];
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

function ConvItem({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const s = STATUS_STYLES[conv.offerStatus];
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors rounded-xl"
      style={{ backgroundColor: active ? "#EBF4FF" : "transparent" }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <Avatar initials={conv.initials} online={conv.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-sm font-bold truncate" style={{ color: active ? "#185FA5" : "#042C53" }}>
            @{conv.username}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">{conv.lastTime}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mb-1.5">{conv.lastMessage}</p>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5"
            style={{ backgroundColor: s.bg, color: s.text }}
          >
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
  const [convs, setConvs] = useState<Conversation[]>(CONVERSATIONS);
  const [activeUsername, setActiveUsername] = useState<string>(CONVERSATIONS[0].username);
  const [input, setInput] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = convs.find((c) => c.username === activeUsername)!;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  function selectConv(username: string) {
    setActiveUsername(username);
    setMobileView("chat");
    // clear unread
    setConvs((prev) => prev.map((c) => c.username === username ? { ...c, unread: 0 } : c));
  }

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const newMsg: Message = {
      id: Date.now(),
      kind: "sent",
      text,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };
    setConvs((prev) =>
      prev.map((c) =>
        c.username === activeUsername
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: text, lastTime: "Şimdi" }
          : c
      )
    );
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</a>
          <a href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-[#185FA5] transition-colors">
            Dashboard
          </a>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden max-w-6xl w-full mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-6" style={{ height: "calc(100vh - 64px)" }}>
        <div className="flex w-full h-full bg-white sm:rounded-2xl sm:border sm:border-gray-100 sm:shadow-sm overflow-hidden">

          {/* ── Conversation list ── */}
          <div
            className={`${mobileView === "chat" ? "hidden" : "flex"} md:flex flex-col w-full md:w-80 border-r border-gray-100 flex-shrink-0`}
          >
            {/* List header */}
            <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-extrabold" style={{ color: "#042C53" }}>Mesajlar</h2>
              <p className="text-xs text-gray-400 mt-0.5">{convs.length} konuşma</p>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
              {convs.map((conv) => (
                <ConvItem
                  key={conv.username}
                  conv={conv}
                  active={activeUsername === conv.username}
                  onClick={() => selectConv(conv.username)}
                />
              ))}
            </div>
          </div>

          {/* ── Chat window ── */}
          <div className={`${mobileView === "list" ? "hidden" : "flex"} md:flex flex-1 flex-col min-w-0`}>

            {/* Chat header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
              {/* Mobile back */}
              <button
                className="md:hidden text-gray-400 hover:text-gray-700 p-1 -ml-1 rounded-lg"
                onClick={() => setMobileView("list")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <Avatar initials={active.initials} online={active.online} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: "#042C53" }}>@{active.username}</p>
                  <span
                    className="text-xs font-semibold rounded-full px-2 py-0.5"
                    style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
                  >
                    {active.niche}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {active.online ? (
                    <span className="text-emerald-500 font-medium">● Çevrimiçi</span>
                  ) : "Çevrimdışı"}
                </p>
              </div>

              <a
                href={`/profile/${active.username}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0"
                style={{ borderColor: "#E6F1FB", color: "#185FA5" }}
              >
                Profili Gör
              </a>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-1">
              {active.messages.map((msg) => {
                if (msg.kind === "status") {
                  return <StatusChip key={msg.id} status={msg.status!} />;
                }

                const isSent = msg.kind === "sent";
                return (
                  <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1`}>
                    <div className="flex flex-col gap-1" style={{ maxWidth: "70%" }}>
                      <div
                        className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={
                          isSent
                            ? { backgroundColor: "#185FA5", color: "white", borderBottomRightRadius: "4px" }
                            : { backgroundColor: "#F3F4F6", color: "#111827", borderBottomLeftRadius: "4px" }
                        }
                      >
                        {msg.text}
                      </div>
                      <span className={`text-xs text-gray-400 ${isSent ? "text-right" : "text-left"} px-1`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-end gap-3">
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
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 resize-none overflow-hidden"
                  style={{ minHeight: "42px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
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

          </div>

        </div>
      </div>
    </div>
  );
}
