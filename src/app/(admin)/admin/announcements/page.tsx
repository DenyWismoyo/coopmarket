"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { announcementService } from "@/services/announcement.service";
import { Announcement } from "@/types/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Megaphone, Trash2, Plus, Users, Globe } from "lucide-react";

export default function AdminAnnouncementsPage() {
  const { userData } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    content: "",
    targetAudience: "all"
  });

  const fetchAnnouncements = async () => {
    if(userData?.coopId) {
       const data = await announcementService.getAnnouncements(userData.coopId);
       setAnnouncements(data);
       setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, [userData]);

  const handleSubmit = async () => {
    if(!userData?.coopId) return;
    try {
      await announcementService.createAnnouncement({
        coopId: userData.coopId,
        title: form.title,
        content: form.content,
        targetAudience: form.targetAudience as any,
        isActive: true,
        authorName: userData.fullName,
      });
      toast.success("Pengumuman diterbitkan");
      setIsDialogOpen(false);
      fetchAnnouncements();
      setForm({ title: "", content: "", targetAudience: "all" });
    } catch(e) { toast.error("Gagal"); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus pengumuman?")) return;
    await announcementService.deleteAnnouncement(id);
    fetchAnnouncements();
    toast.success("Dihapus");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-zinc-900">Pusat Informasi</h1>
           <p className="text-sm text-zinc-500">Kelola pengumuman untuk anggota koperasi.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
               <Plus className="w-4 h-4 mr-2" /> Buat Pengumuman
            </Button>
          </DialogTrigger>
          <DialogContent>
             <DialogHeader><DialogTitle>Buat Pengumuman Baru</DialogTitle></DialogHeader>
             <div className="space-y-4 py-4">
               <div className="space-y-2">
                 <Label>Judul</Label>
                 <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Misal: Rapat Anggota Tahunan" />
               </div>
               <div className="space-y-2">
                 <Label>Isi Pengumuman</Label>
                 <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Tulis pesan lengkap..." className="min-h-[100px]" />
               </div>
               <div className="space-y-2">
                 <Label>Target Pembaca</Label>
                 <Select value={form.targetAudience} onValueChange={v => setForm({...form, targetAudience: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">Semua</SelectItem>
                       <SelectItem value="members">Hanya Anggota</SelectItem>
                       <SelectItem value="public">Publik</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
             </div>
             <DialogFooter>
                <Button onClick={handleSubmit} className="bg-blue-600">Terbitkan</Button>
             </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {announcements.map(item => (
           <Card key={item.id}>
             <CardContent className="p-6 flex justify-between items-start gap-4">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${item.targetAudience === 'members' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                         {item.targetAudience === 'members' ? 'Anggota' : 'Publik'}
                      </span>
                      <span className="text-xs text-zinc-400">
                         {new Date(item.createdAt).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                      </span>
                   </div>
                   <h3 className="font-bold text-lg text-zinc-900">{item.title}</h3>
                   <p className="text-zinc-600 whitespace-pre-wrap">{item.content}</p>
                   <p className="text-xs text-zinc-400 mt-2 italic">Oleh: {item.authorName}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                   <Trash2 className="w-4 h-4" />
                </Button>
             </CardContent>
           </Card>
        ))}
      </div>
    </div>
  );
}