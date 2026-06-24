"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { storageService } from "@/lib/storage";
import { compressImage } from "@/lib/utils"; // Import fungsi kompresi
import { toast } from "sonner";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  onRemove: (url: string) => void;
  disabled?: boolean;
  // Data tambahan untuk penamaan file
  uploaderName?: string;
  productName?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  disabled, 
  uploaderName, 
  productName 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi Ukuran Mentah (Max 10MB sebelum kompresi)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file asli terlalu besar (Max 10MB)");
      return;
    }

    try {
      setIsUploading(true);
      
      // 1. Kompresi Gambar
      const compressedFile = await compressImage(file);
      
      // 2. Upload ke Storage dengan Metadata
      const url = await storageService.uploadImage(compressedFile, "products", {
        uploaderName: uploaderName || "unknown",
        productName: productName || "new_product"
      });
      
      // 3. Update State
      onChange([...value, url]);
      toast.success("Gambar berhasil diunggah");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah gambar. Coba lagi.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Grid Preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {value.map((url) => (
          <div key={url} className="relative aspect-square rounded-md overflow-hidden border bg-zinc-100 group">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Image
              fill
              className="object-cover"
              alt="Product Image"
              src={url}
            />
          </div>
        ))}
      </div>

      {/* Tombol Upload */}
      <div>
        <Button
          type="button"
          disabled={disabled || isUploading}
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="w-full md:w-auto border-dashed border-2 bg-zinc-50 hover:bg-zinc-100"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4 mr-2" />
          )}
          {isUploading ? "Mengompres & Upload..." : "Upload Gambar"}
        </Button>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleUpload}
          disabled={disabled}
        />
        <p className="text-[10px] text-zinc-400 mt-2">
          Otomatis dikompresi ke JPG. Max 5 foto.
        </p>
      </div>
    </div>
  );
}