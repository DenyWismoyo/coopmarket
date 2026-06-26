// File: src/types/playlist.ts

export interface PlaylistItem {
  id: string;
  title: string;
  audioUrl: string; // URL file mp3/audio yang sudah di-upload
  createdAt: string;
}

export interface CooperativePlaylist {
  coopId: string;
  songs: PlaylistItem[];
  isActive: boolean; // Opsional: Untuk menyalakan/mematikan musik di display
}