"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Plus, 
  Trash2, 
  Users, 
  Image as ImageIcon,
  Loader2,
  X,
  Presentation,
  DollarSign,
  AlignLeft
} from "lucide-react";

interface Hall {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  capacity: number;
  imageUrl: string;
  createdAt: any;
}

export default function HallsPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [capacity, setCapacity] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const q = query(collection(db, "halls"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hall[];
      setHalls(docs);
    } catch (error) {
      console.error("Erreur lors du chargement des salles:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !pricePerHour || !capacity || !imageFile) {
      alert("Veuillez remplir tous les champs et ajouter une image");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload image
      const storageRef = ref(storage, `halls/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Save to Firestore
      await addDoc(collection(db, "halls"), {
        name,
        description,
        pricePerHour: Number(pricePerHour),
        capacity: Number(capacity),
        imageUrl: downloadURL,
        createdAt: serverTimestamp()
      });

      // 3. Reset and refresh
      setIsModalOpen(false);
      resetForm();
      fetchHalls();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      alert("Une erreur est survenue lors de l'ajout de la salle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette salle ?")) {
      try {
        await deleteDoc(doc(db, "halls", id));
        fetchHalls();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPricePerHour("");
    setCapacity("");
    setImageFile(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-playfair mb-2">Salles & Espaces</h1>
          <p className="text-gray-400">Gérez les salles de réunion et espaces événementiels</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-gold hover:bg-primary-gold-dark text-black font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter une salle
        </button>
      </div>

      {/* Grid of Halls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {halls.map((hall) => (
          <div key={hall.id} className="bg-secondary-black rounded-2xl overflow-hidden border border-white/5 group hover:border-primary-gold/30 transition-all">
            <div className="aspect-video relative overflow-hidden bg-gray-800">
              <img 
                src={hall.imageUrl} 
                alt={hall.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2">
                <button 
                  onClick={() => handleDelete(hall.id)}
                  className="p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-primary-gold font-bold text-sm border border-primary-gold/30">
                {hall.pricePerHour}€ / heure
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary-gold text-sm font-medium">
                <Users className="w-4 h-4" />
                <span>Capacité: {hall.capacity} personnes</span>
              </div>
              <h3 className="text-xl font-bold text-white font-playfair">{hall.name}</h3>
              <p className="text-gray-400 text-sm line-clamp-2">{hall.description}</p>
            </div>
          </div>
        ))}

        {halls.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500 bg-secondary-black/50 rounded-2xl border border-white/5 border-dashed">
            <Presentation className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucune salle répertoriée</p>
            <p className="text-sm">Cliquez sur "Ajouter une salle" pour commencer</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-secondary-black rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 sticky top-0 z-10 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white font-playfair">Nouvelle Salle</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Image de la salle</label>
                <div 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    imagePreview ? 'border-primary-gold/50 bg-primary-gold/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-sm">Cliquez pour ajouter une image</span>
                    </div>
                  )}
                  <input 
                    id="image-upload"
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Nom de la salle</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Salle de Conférence Alpha"
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary-gold/50 focus:ring-1 focus:ring-primary-gold/50"
                    required
                  />
                  <Presentation className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Prix / heure (€)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary-gold/50 focus:ring-1 focus:ring-primary-gold/50"
                      required
                    />
                    <DollarSign className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Capacité (pers.)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="0"
                      min="1"
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary-gold/50 focus:ring-1 focus:ring-primary-gold/50"
                      required
                    />
                    <Users className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Description & Équipements</label>
                <div className="relative">
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Projecteur, Wifi haut débit, Tableau blanc..."
                    rows={4}
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary-gold/50 focus:ring-1 focus:ring-primary-gold/50 resize-none"
                    required
                  />
                  <AlignLeft className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary-gold text-black font-bold hover:bg-primary-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Ajouter la salle"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
