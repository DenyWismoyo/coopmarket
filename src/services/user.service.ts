import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { UserProfile } from "@/types";

export const userService = {
  // Update Profil Toko Member
  updateShopProfile: async (uid: string, data: { shopName: string; shopDescription: string; phone?: string; address?: string }) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        shopName: data.shopName,
        shopDescription: data.shopDescription,
        phone: data.phone,
        address: data.address,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Error updating shop profile:", error);
      throw error;
    }
  },

  // [BARU] Update Profil Pribadi Member
  updateUserProfile: async (uid: string, data: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, "users", uid);
      // Filter hanya field yang diizinkan untuk update profil
      const safeData = {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        photoURL: data.photoURL,
        updatedAt: new Date().toISOString()
      };
      
      // Hapus field undefined
      Object.keys(safeData).forEach(key => (safeData as any)[key] === undefined && delete (safeData as any)[key]);

      await updateDoc(userRef, safeData);
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
};