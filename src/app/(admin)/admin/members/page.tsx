// File: src/app/(admin)/admin/members/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DocumentSnapshot } from "firebase/firestore";
import { 
  Search, 
  Loader2, 
  ChevronDown, 
  MoreVertical, 
  UserCheck, 
  UserX,
  Shield,
  Phone,
  MapPin,
  Eye,
  Calendar
} from "lucide-react";

import { memberService } from "@/services/member.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminMembersPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error
  } = useInfiniteQuery({
    queryKey: ['adminMembers', userData?.coopId],
    queryFn: async ({ pageParam }) => {
      if (!userData?.coopId) return { data: [], hasMore: false, lastVisible: undefined };
      return await memberService.getMembersByCoopPaginated(
        userData.coopId, 
        20, 
        pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.coopId,
  });

  const members = data?.pages.flatMap((page: any) => page.data) || [];

  const filteredMembers = members.filter((m: any) => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.nik?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
           {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError) return <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-6 p-4 md:p-6 pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Data Anggota</h1>
        <p className="text-xs md:text-sm text-zinc-500 mt-1">Database seluruh anggota koperasi aktif.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border shadow-sm max-w-md w-full focus-within:ring-2 ring-blue-100 transition-all">
         <Search className="w-4 h-4 text-zinc-400 ml-2 shrink-0" />
         <Input 
           placeholder="Cari Nama atau NIK..." 
           className="border-none shadow-none focus-visible:ring-0 h-9 w-full bg-transparent text-sm"
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
         />
      </div>

      {/* Konten Utama */}
      <Card className="overflow-hidden border-zinc-200 shadow-sm bg-white">
         
         {/* 1. DESKTOP VIEW (TABLE) */}
         <div className="hidden md:block overflow-x-auto">
           <Table>
             <TableHeader className="bg-zinc-50">
               <TableRow>
                 <TableHead className="w-[80px]">Profil</TableHead>
                 <TableHead>Nama & NIK</TableHead>
                 <TableHead>Kontak</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Bergabung</TableHead>
                 <TableHead className="text-right">Aksi</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredMembers.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="h-32 text-center text-zinc-500">Tidak ada data anggota.</TableCell>
                 </TableRow>
               ) : (
                 filteredMembers.map((member: any) => (
                   <TableRow key={member.uid} className="hover:bg-zinc-50/50">
                     <TableCell>
                        <Avatar className="h-10 w-10 border shadow-sm">
                           <AvatarImage src={member.photoURL} />
                           <AvatarFallback className="font-bold text-zinc-600 bg-zinc-100">{member.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                     </TableCell>
                     <TableCell>
                        <div className="font-bold text-zinc-900">{member.fullName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">NIK: {member.nik || '-'}</div>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col gap-1 text-[11px] text-zinc-600">
                           <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-400" /> {member.phone || '-'}</span>
                           <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-zinc-400" /> {member.address ? member.address.slice(0, 25) + '...' : '-'}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge variant="outline" className={member.status === 'active' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                           {member.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                     </TableCell>
                     <TableCell className="text-zinc-500 text-xs">
                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }) : '-'}
                     </TableCell>
                     <TableCell className="text-right">
                       <MemberActionMenu member={member} router={router} />
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>

         {/* 2. MOBILE VIEW (LIST CARD) */}
         <div className="md:hidden flex flex-col divide-y divide-zinc-100">
            {filteredMembers.length === 0 ? (
               <div className="p-8 text-center text-zinc-500 text-sm">Tidak ada data anggota.</div>
            ) : (
               filteredMembers.map((member: any) => (
                  <div key={member.uid} className="p-4 bg-white hover:bg-zinc-50 transition-colors flex flex-col gap-3">
                     <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                           <Avatar className="h-10 w-10 border shadow-sm shrink-0">
                              <AvatarImage src={member.photoURL} />
                              <AvatarFallback className="font-bold text-zinc-600 bg-zinc-100">{member.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                           </Avatar>
                           <div className="min-w-0">
                              <p className="font-bold text-sm text-zinc-900 truncate">{member.fullName}</p>
                              <p className="text-[10px] text-zinc-500 font-mono tracking-tight mt-0.5 truncate">NIK: {member.nik || '-'}</p>
                           </div>
                        </div>
                        <MemberActionMenu member={member} router={router} />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                        <div className="flex flex-col gap-1.5 justify-center">
                           <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                              <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{member.phone || 'Tak ada HP'}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                              <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{member.createdAt ? new Date(member.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }) : '-'}</span>
                           </div>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-1.5 border-l border-zinc-200 pl-2">
                           <Badge variant="outline" className={`text-[9px] h-5 px-2 font-bold ${member.status === 'active' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                              {member.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                           </Badge>
                           <span className="text-[9px] font-semibold text-blue-600 cursor-pointer" onClick={() => router.push(`/admin/members/${member.uid}`)}>Lihat Detail &rarr;</span>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>

      </Card>
      
      {/* Pagination Load More */}
      <div className="flex justify-center pt-4">
         {hasNextPage ? (
            <Button 
               variant="outline" 
               onClick={() => fetchNextPage()} 
               disabled={isFetchingNextPage}
               className="shadow-sm rounded-full px-8 bg-white border-zinc-200"
            >
               {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
               Muat Lebih Banyak
            </Button>
         ) : (
            <p className="text-[10px] sm:text-xs text-zinc-400 font-medium tracking-wide uppercase">Menampilkan {members.length} anggota</p>
         )}
      </div>
    </div>
  );
}

// Komponen Reusable untuk Menu Dropdown (Dipakai di Desktop & Mobile)
function MemberActionMenu({ member, router }: { member: any, router: any }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100 shrink-0 border border-zinc-200 bg-white md:border-0 md:bg-transparent shadow-sm md:shadow-none">
          <MoreVertical className="w-4 h-4 text-zinc-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-zinc-200">
        <DropdownMenuLabel className="text-[10px] uppercase text-zinc-500 tracking-wider">Opsi Anggota</DropdownMenuLabel>
        <DropdownMenuItem className="cursor-pointer font-bold py-2.5" onClick={() => router.push(`/admin/members/${member.uid}`)}>
          <Eye className="w-4 h-4 mr-2 text-blue-600" /> Detail Profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer font-semibold">
          <UserX className="w-4 h-4 mr-2" /> Nonaktifkan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}