export default function EarningsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center px-4">
      <span className="text-5xl">💰</span>
      <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>Kazançlar</h1>
      <p className="text-gray-500 max-w-sm">Kazanç takibi yakında burada olacak.</p>
      <a href="/dashboard" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
        ← Dashboard&apos;a Dön
      </a>
    </div>
  );
}
