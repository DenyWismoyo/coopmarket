// File: src/app/(auth)/vision/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
   ArrowLeft, 
   ShoppingBag, 
   Users, 
   Coins, 
   SmartphoneNfc, 
   Rocket, 
   Globe2,
   AlertTriangle,
   Network
} from "lucide-react";

function VisionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "member";

  const handleContinue = () => {
    if (type === "unit") {
      router.push("/register-unit");
    } else {
      router.push("/register");
    }
  };

  const cConnectValues = [
    {
      title: "Commerce (Perdagangan)",
      icon: <ShoppingBag className="w-6 h-6 text-orange-500" />,
      desc: "Menjadi penghubung yang memfasilitasi perdagangan dan perputaran ekonomi, baik secara B2B (antar organisasi) maupun B2C (langsung ke publik).",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100"
    },
    {
      title: "Collaboration (Kolaborasi)",
      icon: <Users className="w-6 h-6 text-blue-500" />,
      desc: "Wadah kolaborasi Smart Hub bermodel Pentahelix, menjadi titik temu antara pemerintah, akademisi, industri, dan masyarakat lokal.",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100"
    },
    {
      title: "Capital (Permodalan)",
      icon: <Coins className="w-6 h-6 text-green-500" />,
      desc: "Menghubungkan anggota dengan literasi keuangan, transparansi simpanan, dan pendistribusian keuntungan yang akurat.",
      bgColor: "bg-green-50",
      borderColor: "border-green-100"
    },
    {
      title: "Cashless (Nontunai)",
      icon: <SmartphoneNfc className="w-6 h-6 text-purple-500" />,
      desc: "Mengedukasi dan menghubungkan ekosistem bisnis lokal dengan infrastruktur pembayaran digital yang modern dan efisien.",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100"
    },
    {
      title: "Catalyst (Katalisator)",
      icon: <Rocket className="w-6 h-6 text-red-500" />,
      desc: "Mempercepat proses digitalisasi administrasi serta menjadi pendorong pertumbuhan ekosistem UMKM agar berbasis data.",
      bgColor: "bg-red-50",
      borderColor: "border-red-100"
    },
    {
      title: "Citizen (Masyarakat Sipil)",
      icon: <Globe2 className="w-6 h-6 text-teal-500" />,
      desc: "Penghubung masyarakat yang mengelola data komunitas secara terstruktur untuk membangun perlindungan dan jejaring wilayah.",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-100"
    }
  ];

  return (
    <Card className="w-full shadow-xl border-blue-100">
      <CardHeader className="space-y-1 text-center border-b border-zinc-100 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-red-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10">
           <CardTitle className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">
             Visi & Misi C-Connect
           </CardTitle>
           <CardDescription className="text-base mt-2 mx-auto">
             Platform ini didesain secara fleksibel dan strategis dengan membawa 6 pilar utama penyokong ekonomi kerakyatan.
           </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="pt-8">
         {/* Diubah menjadi 1 kolom utuh (grid-cols-1) */}
         <div className="grid grid-cols-1 gap-4">
            {cConnectValues.map((val, idx) => (
               <div key={idx} className={`p-4 rounded-xl border ${val.borderColor} ${val.bgColor} flex gap-4 transition-all hover:shadow-md`}>
                  <div className="shrink-0 mt-1">
                     <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        {val.icon}
                     </div>
                  </div>
                  <div>
                     <h4 className="font-bold text-zinc-900 mb-1">{val.title}</h4>
                     <p className="text-sm text-zinc-600 leading-relaxed">{val.desc}</p>
                  </div>
               </div>
            ))}
         </div>

         <div className="mt-8 p-4 bg-zinc-900 text-white rounded-xl flex items-center gap-4 shadow-lg">
            <Network className="w-10 h-10 text-blue-400 shrink-0 hidden sm:block" />
            <p className="text-sm sm:text-base font-medium leading-relaxed">
               Semakin banyak unit, komunitas, atau organisasi yang bergabung, akan <strong>semakin kuat dan kokoh jejaring yang terbangun dari akar rumput (grassroots)</strong> untuk saling memajukan ekosistem ini.
            </p>
         </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4 border-t border-zinc-100 pt-6">
        <Button 
          onClick={handleContinue}
          className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-transform active:scale-[0.98]"
        >
          Masuk ke Formulir Pendaftaran
        </Button>
        <Button variant="link" onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-800">
          <ArrowLeft className="mr-2 h-3 w-3" /> Kembali ke Persetujuan
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VisionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="animate-pulse flex gap-2 items-center text-zinc-400 font-medium"><AlertTriangle className="w-5 h-5"/> Memuat visi & misi...</div>}>
        <VisionContent />
      </Suspense>
    </div>
  );
}