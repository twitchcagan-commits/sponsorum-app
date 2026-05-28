export default function EarningsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #E6F1FB 0%, #ffffff 60%)" }}>

      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>
            Sponsorum
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4 py-20">
        <span
          className="inline-block text-xs font-semibold uppercase tracking-widest rounded-full px-4 py-1.5"
          style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
        >
          Yakında
        </span>
        <span className="text-6xl">💰</span>
        <div>
          <h1 className="text-3xl font-extrabold mb-3" style={{ color: "#042C53" }}>Kazançlar</h1>
          <p className="text-gray-500 max-w-sm leading-relaxed">
            Tamamlanan kampanyalarından elde ettiğin kazançları ve ödeme geçmişini buradan takip edebileceksin.
          </p>
        </div>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border-2 transition-all hover:-translate-y-0.5"
          style={{ borderColor: "#185FA5", color: "#185FA5" }}
        >
          ← Dashboard&apos;a Dön
        </a>
      </main>

    </div>
  );
}
