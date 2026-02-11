"use client";

import { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Save, Plus, X } from "lucide-react";
import Link from "next/link";

export default function NewRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [size, setSize] = useState("");
  const [type, setType] = useState("deluxe");
  const [view, setView] = useState("");
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [amenityInput, setAmenityInput] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addAmenity = () => {
    if (amenityInput.trim()) {
      setAmenities([...amenities, amenityInput.trim()]);
      setAmenityInput("");
    }
  };

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = "";

      // 1. Upload Image if exists
      if (imageFile) {
        const storageRef = ref(storage, `rooms/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 2. Add document to Firestore with consistent schema
      await addDoc(collection(db, "rooms"), {
        amenities,
        capacity: parseInt(capacity),
        description,
        images: imageUrl ? [imageUrl] : [], // Array of strings
        isAvailable: true,
        name,
        pricePerNight: parseInt(price),
        rating: 4.7, // Default starting rating
        size: size || "N/A",
        type,
        view: view || "Standard",
        createdAt: serverTimestamp(),
      });

      router.push("/dashboard/rooms");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      alert("Erreur lors de la création de la chambre");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/rooms" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux chambres
      </Link>

      <div className="bg-secondary-black rounded-2xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold font-playfair mb-6 text-white">Ajouter une nouvelle chambre</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Photo de la chambre</label>
            <div className="relative h-48 bg-primary-black border-2 border-dashed border-white/10 rounded-xl overflow-hidden hover:border-primary-gold/50 transition-colors group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 group-hover:text-primary-gold transition-colors">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Cliquez pour ajouter une photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Name & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300 ml-1">Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
                placeholder="ex: Chambre Deluxe"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300 ml-1">Type</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
                placeholder="ex: deluxe"
                required
              />
            </div>
          </div>

          {/* Price & Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300 ml-1">Prix / nuit ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
                placeholder="ex: 280"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300 ml-1">Capacité (pers)</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
                placeholder="ex: 2"
                required
              />
            </div>
          </div>

          {/* Size & View */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300 ml-1">Taille</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
                placeholder="ex: 45 m²"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300 ml-1">Vue</label>
              <input
                type="text"
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
                placeholder="ex: Vue Jardin"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors resize-none"
              placeholder="Description détaillée..."
              required
            />
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Équipements</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                className="flex-1 bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
                placeholder="ex: Vue mer"
              />
              <button
                type="button"
                onClick={addAmenity}
                className="bg-white/10 text-white p-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {amenities.map((item, index) => (
                <span key={index} className="flex items-center gap-2 bg-primary-gold/10 text-primary-gold px-3 py-1 rounded-lg border border-primary-gold/20 text-sm">
                  {item}
                  <button type="button" onClick={() => removeAmenity(index)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-gold to-primary-gold-dark text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
          >
            {loading ? (
              "Enregistrement..."
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer la chambre
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
