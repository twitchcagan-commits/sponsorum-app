"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Role = "yayinci" | "marka" | null;
type SessionHint = { username: string | null; role: Role };

interface NavbarProps {
  navLinks?: React.ReactNode; // used only when the user is logged-out
  maxWidth?: string;
}

// ─── localStorage helper ──────────────────────────────────────────────────────

// Supabase persists the session in localStorage under a key matching
// sb-<project-ref>-auth-token. Reading it is synchronous and available
// immediately on the client — no async round-trip needed.
function readLocalStorageSession(): SessionHint | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const user = parsed?.user ?? parsed; // handle both wrapped and flat shapes
      if (!user?.user_metadata) continue;
      return {
        username: user.user_metadata.username ?? null,
        role:     (user.user_metadata.role    ?? null) as Role,
      };
    }
  } catch {
    // localStorage unavailable (e.g. private-browsing restrictions) — fail silently
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DropdownLink({
  href, label, icon, unread = 0,
}: {
  href: string; label: string; icon: string; unread?: number;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#E6F1FB] hover:text-[#185FA5] transition-colors"
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {unread > 0 && (
        <span className="text-xs font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </a>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar({ navLinks, maxWidth = "max-w-7xl" }: NavbarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [loggedIn,     setLoggedIn]     = useState(false);
  const [username,     setUsername]     = useState<string | null>(null);
  const [role,         setRole]         = useState<Role>(null);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Synchronous localStorage read — runs before every paint ─────────────────
  //
  // Supabase writes the session to localStorage synchronously at login.
  // Reading it in useLayoutEffect fires BEFORE the browser paints, so the
  // navbar always shows the correct logged-in state on the very first frame —
  // including when the user navigates back and React re-initialises component
  // state from scratch.
  useLayoutEffect(() => {
    const session = readLocalStorageSession();
    if (session) {
      setLoggedIn(true);
      if (session.username) setUsername(session.username);
      if (session.role)     setRole(session.role);
    } else {
      setLoggedIn(false);
      setUsername(null);
      setRole(null);
    }
  }, [pathname]);

  // ── Background verification + realtime auth events ────────────────────────────
  //
  // Verifies the session server-side once on mount and keeps state in sync with
  // any auth events (sign-in / sign-out / token refresh) that happen during the
  // session. The profile DB query fills in data that may not be in the cookie
  // (e.g. if the username was updated after the last middleware run).
  useEffect(() => {
    const supabase = createClient();

    async function verify() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoggedIn(false);
        setUsername(null);
        setRole(null);
        return;
      }
      setLoggedIn(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.username) setUsername(profile.username);
      if (profile?.role)     setRole(profile.role as Role);
    }

    verify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setLoggedIn(false);
        setUsername(null);
        setRole(null);
      } else {
        setLoggedIn(true);
        const u = session.user;
        if (u.user_metadata?.username) setUsername(u.user_metadata.username);
        if (u.user_metadata?.role)     setRole(u.user_metadata.role as Role);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Dropdown outside-click / Escape ──────────────────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown",   onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown",   onKeyDown);
    };
  }, [dropdownOpen]);

  async function handleSignOut() {
    setDropdownOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut(); // Supabase removes the localStorage entry automatically
    router.push("/");
  }

  const avatarInitials = username ? username.slice(0, 2).toUpperCase() : "?";

  // Middle nav — role-based when logged in, falls back to prop when logged out
  const middleLinks = loggedIn && role ? (
    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
      {role === "yayinci" ? (
        <>
          <a href="/offers"       className="text-gray-600 hover:text-[#185FA5] transition-colors">Tekliflerim</a>
          <a href="/messages"     className="text-gray-600 hover:text-[#185FA5] transition-colors">Mesajlarım</a>
          <a href="/profile/edit" className="text-gray-600 hover:text-[#185FA5] transition-colors">Profilim</a>
        </>
      ) : (
        <>
          <a href="/search"    className="text-gray-600 hover:text-[#185FA5] transition-colors">Sponsor Bul</a>
          <a href="/campaigns" className="text-gray-600 hover:text-[#185FA5] transition-colors">Kampanyalarım</a>
          <a href="/payments"  className="text-gray-600 hover:text-[#185FA5] transition-colors">Ödemeler</a>
        </>
      )}
    </nav>
  ) : !loggedIn ? (navLinks ?? null) : null;

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16`}>

        <a href="/" className="text-2xl font-extrabold tracking-tight flex-shrink-0" style={{ color: "#185FA5" }}>
          Sponsorum
        </a>

        {middleLinks}

        <div className="flex items-center gap-1.5 sm:gap-2">
          {loggedIn ? (
            <>
              {/* Messages icon */}
              <a
                href="/messages"
                title="Mesajlar"
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-[#185FA5] hover:bg-[#E6F1FB] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </a>

              {/* Balance chip */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
                style={{ backgroundColor: "#E6F1FB" }}
              >
                <span className="text-xs font-medium" style={{ color: "#185FA5" }}>Bakiye</span>
                <span className="font-bold" style={{ color: "#042C53" }}>₺0</span>
              </div>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: "#042C53" }}
                  >
                    {avatarInitials}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[80px] truncate">
                    {username ?? "…"}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                    <div className="px-4 py-3 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: "#042C53" }}
                      >
                        {avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#042C53" }}>
                          @{username ?? "…"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {role === "yayinci" ? "🎙️ Yayıncı" : role === "marka" ? "🏢 Marka" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    <div className="py-1">
                      <DropdownLink href="/dashboard" label="Dashboard" icon="🏠" />
                      {role === "yayinci" && (
                        <>
                          <DropdownLink href="/profile/complete" label="Profilimi Tamamla" icon="👤" />
                          <DropdownLink href="/profile/edit"     label="Profilimi Düzenle" icon="✏️" />
                          <DropdownLink href="/offers"           label="Tekliflerim"        icon="📨" />
                          <DropdownLink href="/messages"         label="Mesajlarım"         icon="💬" unread={unreadCount} />
                        </>
                      )}
                      {role === "marka" && (
                        <>
                          <DropdownLink href="/marka/edit" label="Profilimi Düzenle" icon="✏️" />
                          <DropdownLink href="/search"     label="Sponsor Bul"       icon="🔍" />
                          <DropdownLink href="/campaigns"  label="Kampanyalarım"     icon="📊" />
                          <DropdownLink href="/payments"   label="Ödemeler"          icon="💳" />
                          <DropdownLink href="/messages"   label="Mesajlarım"        icon="💬" unread={unreadCount} />
                        </>
                      )}
                      <DropdownLink href="/settings" label="Ayarlar" icon="⚙️" />
                    </div>

                    <div className="border-t border-gray-100" />

                    <div className="py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <span className="text-base w-5 text-center">🚪</span>
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="hidden sm:inline-block text-sm font-medium text-gray-600 hover:text-[#185FA5] transition-colors px-3 py-2"
              >
                Giriş
              </a>
              <a
                href="/register"
                className="text-sm font-semibold text-white rounded-lg px-4 py-2 transition-colors"
                style={{ backgroundColor: "#185FA5" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}
              >
                Ücretsiz başla
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
