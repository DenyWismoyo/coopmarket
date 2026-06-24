"use client";

import { useState } from "react";
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
  MapPin
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
  const [searchQuery, setSearchQuery] = useState("");

  // 1. QUERY: Fetch Members Pagination
  // Menggunakan fungsi service baru yang kita buat tadi: getMembersByCoopPaginated
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
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

  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
           {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (isError) return <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-6 p-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Data Anggota</h1>
        <p className="text-sm text-zinc-500">Database seluruh anggota koperasi aktif.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm max-w-md">
         <Search className="w-4 h-4 text-zinc-400 ml-2" />
         <Input 
           placeholder="Cari Nama atau NIK..." 
           className="border-none shadow-none focus-visible:ring-0 h-9"
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
         />
      </div>

      {/* Table Content */}
      <Card className="overflow-hidden border-zinc-200 shadow-sm">
         <div className="overflow-x-auto">
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
                   <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                      Tidak ada data anggota.
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredMembers.map((member: any) => (
                   <TableRow key={member.uid} className="hover:bg-zinc-50/50">
                     <TableCell>
                        <Avatar className="h-10 w-10 border">
                           <AvatarImage src={member.photoURL} />
                           <AvatarFallback>{member.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                     </TableCell>
                     <TableCell>
                        <div className="font-medium text-zinc-900">{member.fullName}</div>
                        <div className="text-xs text-zinc-500 font-mono">{member.nik || '-'}</div>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-zinc-600">
                           <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {member.phone || '-'}</span>
                           <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {member.address ? member.address.slice(0, 20) + '...' : '-'}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                           {member.status}
                        </Badge>
                     </TableCell>
                     <TableCell className="text-zinc-500 text-sm">
                        {member.joinedAt ? new Date(member.joinedAt.seconds * 1000 || member.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }) : '-'}
                     </TableCell>
                     <TableCell className="text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreVertical className="w-4 h-4 text-zinc-400" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuLabel>Menu Anggota</DropdownMenuLabel>
                           <DropdownMenuItem>
                              <Shield className="w-4 h-4 mr-2" /> Detail Profil
                           </DropdownMenuItem>
                           <DropdownMenuItem className="text-red-600">
                              <UserX className="w-4 h-4 mr-2" /> Nonaktifkan
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
      </Card>
      
      {/* Load More */}
      <div className="flex justify-center pt-4">
         {hasNextPage ? (
            <Button 
               variant="outline" 
               onClick={() => fetchNextPage()} 
               disabled={isFetchingNextPage}
            >
               {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
               Muat Lebih Banyak
            </Button>
         ) : (
            <p className="text-xs text-zinc-400">Total {members.length} anggota ditampilkan.</p>
         )}
      </div>
    </div>
  );
}