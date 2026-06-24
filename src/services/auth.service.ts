import { auth, db } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { UserProfile, UserRole, UserStatus } from "@/types/user";

// Interface lengkap untuk data registrasi
export interface RegisterData {
  email: string;
  password?: string; // Dibuat opsional untuk kebutuhan Google Sign-In
  fullName: string;
  role: UserRole;
  phone: string;
  address: string;
  nik: string;
  status: UserStatus;
  coopId: string;
  coopName?: string;
  uid?: string; // Tambahan untuk referensi UID dari Auth
}

export const authService = {
  // 1. HELPER: Cari Email berdasarkan Identifier (NIK / No HP / Email)
  findEmailByIdentifier: async (identifier: string): Promise<string | null> => {
    if (identifier.includes('@')) return identifier;
    try {
      const usersRef = collection(db, "users");
      const cleanIdentifier = identifier.trim();
      
      const nikQuery = query(usersRef, where("nik", "==", cleanIdentifier));
      const nikSnapshot = await getDocs(nikQuery);
      if (!nikSnapshot.empty) {
        return nikSnapshot.docs[0].data().email;
      }
      
      const phoneQuery = query(usersRef, where("phone", "==", cleanIdentifier));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        return phoneSnapshot.docs[0].data().email;
      }
      return null;
    } catch (error) {
      console.error("Error lookup email:", error);
      return null;
    }
  },

  // 2. LOGIN SMART (Menerima Email / NIK / HP)
  login: async (identifier: string, pass: string) => {
    const email = await authService.findEmailByIdentifier(identifier);
    if (!email) {
      throw new Error("Akun tidak ditemukan. Pastikan NIK atau No. HP sudah terdaftar.");
    }
    return await signInWithEmailAndPassword(auth, email, pass);
  },

  // [BARU] LOGIN DENGAN GOOGLE
  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential.user;
    } catch (error) {
      console.error("Google Login Error:", error);
      throw error;
    }
  },

  // 3. REGISTER ANGGOTA BARU (DENGAN EMAIL & PASSWORD)
  register: async (data: RegisterData) => {
    try {
      if (!data.password) throw new Error("Password wajib diisi untuk registrasi manual");

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.fullName });

      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        fullName: data.fullName,
        role: data.role,
        status: data.status,
        phone: data.phone,
        address: data.address,
        nik: data.nik,
        coopId: data.coopId,
        coopName: data.coopName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      return user;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  // [BARU] LENGKAPI PROFIL (SETELAH GOOGLE LOGIN)
  completeUserProfile: async (data: RegisterData) => {
    try {
      if (!data.uid) throw new Error("UID tidak ditemukan");

      const userProfile: UserProfile = {
        uid: data.uid,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        status: data.status,
        phone: data.phone,
        address: data.address,
        nik: data.nik,
        coopId: data.coopId,
        coopName: data.coopName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", data.uid), userProfile);
      return true;
    } catch (error) {
      console.error("Complete profile error:", error);
      throw error;
    }
  },

  // 4. CREATE ADMIN UNIT
  createUnitAdmin: async (data: RegisterData) => {
    if (!data.password) throw new Error("Password wajib diisi");

    const secondaryApp = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
        const user = userCredential.user;

        const userProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            fullName: data.fullName,
            role: 'unit_admin',
            status: 'active',
            phone: data.phone,
            address: data.address,
            coopId: data.coopId,
            coopName: data.coopName,
            nik: data.nik || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", user.uid), userProfile);
        await firebaseSignOut(secondaryAuth);
        return user;
    } catch (error) {
        console.error("Error creating unit admin:", error);
        throw error;
    }
  },

  // 5. MANAJEMEN PASSWORD
  sendPasswordReset: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Error sending reset email:", error);
      throw error;
    }
  },
  updateUserPassword: async (newPassword: string) => {
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        return true;
      }
      throw new Error("No user logged in");
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  },

  // 6. UTILS LAINNYA
  logout: async () => {
    return await firebaseSignOut(auth);
  },
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, "users", uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { uid: snapshot.id, ...snapshot.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },
  onAuthStateChange: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};