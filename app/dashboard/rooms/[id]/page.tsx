"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Upload, Save, Plus, X, Trash2 } from "lucide-react";
import Link from "next/link";

export default function RoomDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [amenityInput, setAmenityInput] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (id) fetchRoom();
  }, [id]);

  const fetchRoom = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "rooms", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
        setDescription(data.description || "");
        setPrice(data.price ? data.price.toString() : "");
        setAmenities(data.amenities || []);
        if (data.imageUrl) setImagePreview(data.imageUrl);
      }
    } catch (error) {
      console.error("Erreur fetch:", error);
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);

    try {
      let imageUrl = imagePreview;

      // Upload new image if selected
      if (imageFile) {
        const storageRef = ref(storage, `rooms/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "rooms", id as string), {
        name,
        description,
        price: parseInt(price),
        amenities,
        imageUrl
      });

      alert("Chambre mise à jour avec succès !");
      router.push("/dashboard/rooms");
    } catch (error) {
      console.error("Erreur update:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette chambre définitivement ?")) return;
    try {
      await deleteDoc(doc(db, "rooms", id as string));
      router.push("/dashboard/rooms");
    } catch (error) {
      console.error("Erreur delete:", error);
      alert("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard/rooms" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour aux chambres
        </Link>
        <button 
          onClick={handleDelete}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-bold"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      </div>

      <div className="bg-secondary-black rounded-2xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold font-playfair mb-6 text-white">Modifier la chambre</h2>

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
                  <span className="text-sm font-medium">Cliquez pour changer la photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Nom de la chambre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
              required
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Prix par nuit ($)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-primary-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-gold focus:ring-1 focus:ring-primary-gold transition-colors resize-none"
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
                placeholder="Ajouter un équipement..."
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
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary-gold to-primary-gold-dark text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
          >
            {saving ? (
              "Enregistrement..."
            ) : (
              <>
                <Save className="w-5 h-5" />
                Mettre à jour
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
