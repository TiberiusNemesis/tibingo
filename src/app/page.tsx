import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-4xl font-bold text-amber-800">Bingo</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/display"
          className="block w-full py-4 bg-amber-500 hover:bg-amber-600 text-white text-center rounded-xl font-bold text-xl transition-colors"
        >
          Tela de Exibição
        </Link>
        <Link
          href="/control"
          className="block w-full py-4 bg-slate-800 hover:bg-slate-700 text-white text-center rounded-xl font-bold text-xl transition-colors"
        >
          Controle
        </Link>
      </div>
    </div>
  );
}
