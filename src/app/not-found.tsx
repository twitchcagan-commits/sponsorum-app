import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #E6F1FB 0%, #ffffff 60%)" }}>

      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <Link href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>
            Sponsorum
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">

          <p className="text-7xl font-black mb-4" style={{ color: "#185FA5" }}>404</p>

          <h1 className="text-3xl font-extrabold mb-3" style={{ color: "#042C53" }}>Sayfa Bulunamadı</h1>

          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Aradığın sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
          </p>

          <Link
            href="/"
            className="inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#185FA5" }}
          >
            Ana Sayfaya Dön
          </Link>

        </div>
      </div>
    </div>
  );
}
