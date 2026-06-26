import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-zinc-50 relative flex flex-col items-center justify-center p-4">
      
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-2/3 bg-gradient-to-b from-red-50 to-transparent" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Header Kecil / Logo */}
      <div className="mb-8 z-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 border border-white backdrop-blur-md shadow-sm mb-4">
           <Image src="/icon.png" width={28} height={28} alt="Logo" className="object-contain" />
           <span className="text-sm font-bold text-zinc-900 tracking-tight">CoopConnect</span>
        </div>
        
      </div>

      {/* Main Content (Form) */}
      <div className="w-full max-w-md z-10">
        {children}
      </div>

      {/* Footer Sederhana */}
      <div className="mt-8 text-center text-xs text-zinc-400 z-10">
        &copy; {new Date().getFullYear()} Hak Cipta Dilindungi.
      </div>
    </div>
  );
}