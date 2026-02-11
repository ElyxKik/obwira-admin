"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Lock, Mail } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Vérifier le rôle admin
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "admin") {
          router.push("/dashboard");
        } else {
          setError("Accès non autorisé. Compte admin requis.");
          await auth.signOut();
        }
      } else {
        // Cas de secours temporaire pour le développement si pas de doc user
        // router.push("/dashboard"); 
        setError("Utilisateur introuvable en base.");
        await auth.signOut();
      }
    } catch (err: any) {
      console.error(err);
      setError("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-black p-4">
      <div className="max-w-md w-full bg-secondary-black p-8 rounded-2xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <Image 
              src="/logo_obwira.png" 
              alt="Obwira Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">Obwira Admin</h1>
          <p className="text-gray-400 text-sm">Connexion au tableau de bord</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-primary-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
                placeholder="admin@selton.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-primary-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-gold to-primary-gold-dark text-black font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? "Connexion..." : "SE CONNECTER"}
          </button>
        </form>
      </div>
    </div>
  );
}
