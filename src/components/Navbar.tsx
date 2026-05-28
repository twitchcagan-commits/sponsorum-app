"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface NavbarProps {
  navLinks?: React.ReactNode;
  maxWidth?: string;
}

export default function Navbar({ navLinks, maxWidth = "max-w-7xl" }: NavbarProps) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setLoggedIn(!!session)
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16`}>
        <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>
          Sponsorum
        </a>

        {navLinks}

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              <a
                href="/dashboard"
                className="hidden sm:inline-block text-sm font-medium text-gray-600 hover:text-[#185FA5] transition-colors px-3 py-2"
              >
                Dashboard
              </a>
              <button
                onClick={handleSignOut}
                className="text-sm font-semibold text-white rounded-lg px-4 py-2 transition-colors"
                style={{ backgroundColor: "#185FA5" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}
              >
                Çıkış Yap
              </button>
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
