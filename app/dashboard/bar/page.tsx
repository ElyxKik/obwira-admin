"use client";

import { useEffect, useState, useRef } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Wine, Edit2, Image as ImageIcon, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface DrinkItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'signature' | 'classic' | 'soft';
  imageUrl?: string;
}

export default function BarPage() {
  const [drinks, setDrinks] = useState<DrinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("signature");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchDrinks();
  }, []);

  const fetchDrinks = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "bar_menu"));
      const items: DrinkItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as DrinkItem);
      });
      setDrinks(items);
    } catch (error) {
      console.error("Erreur fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategory("signature");
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenModal = (drink?: DrinkItem) => {
    if (drink) {
      setEditingId(drink.id);
      setName(drink.name);
      setDescription(drink.description);
      setPrice(drink.price.toString());
      setCategory(drink.category);
      setImagePreview(drink.imageUrl || null);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
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
    setIsSubmitting(true);
    
    try {
      let imageUrl = imagePreview;

      // Upload image if new file selected
      if (imageFile) {
        const storageRef = ref(storage, `bar/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const drinkData = {
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "bar_menu", editingId), drinkData);
      } else {
        await addDoc(collection(db, "bar_menu"), {
          ...drinkData,
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchDrinks();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce cocktail ?")) return;
    try {
      await deleteDoc(doc(db, "bar_menu", id));
      setDrinks(drinks.filter(item => item.id !== id));
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const categories = {
    signature: "Cocktails Signature",
    classic: "Les Classiques",
    soft: "Sans Alcool"
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold font-playfair text-white">Carte du Bar</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-gold-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un cocktail
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.keys(categories) as Array<keyof typeof categories>).map((cat) => {
            const items = drinks.filter(i => i.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} className="bg-secondary-black rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-primary-gold mb-4 font-playfair flex items-center gap-2">
                  <Wine className="w-5 h-5" />
                  {categories[cat]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                      <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                        {item.imageUrl ? (
                          <Image 
                            src={item.imageUrl} 
                            alt={item.name} 
                            fill 
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Wine className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white">{item.name}</h4>
                            <span className="font-bold text-primary-gold">{item.price}$</span>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2 mt-1">{item.description}</p>
                        </div>
                        
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                          <button 
                            onClick={() => handleOpenModal(item)}
                            className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-400/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-secondary-black p-8 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white font-playfair">
                {editingId ? "Modifier le Cocktail" : "Nouveau Cocktail"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400 block">Photo du cocktail</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-gold/50 hover:bg-white/5 transition-colors relative overflow-hidden group"
                >
                  {imagePreview ? (
                    <>
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        fill 
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-bold">Changer l'image</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                      <p className="text-gray-500 text-sm">Cliquez pour ajouter une image</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1.5">Nom</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-primary-black border border-white/10 rounded-lg p-3 text-white focus:border-primary-gold outline-none transition-colors"
                  placeholder="Ex: Mojito Royal"
                  required 
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-primary-black border border-white/10 rounded-lg p-3 text-white focus:border-primary-gold outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Ingrédients, saveurs..."
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">Prix ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={price} 
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-primary-black border border-white/10 rounded-lg p-3 text-white focus:border-primary-gold outline-none transition-colors"
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">Catégorie</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-primary-black border border-white/10 rounded-lg p-3 text-white focus:border-primary-gold outline-none transition-colors appearance-none"
                  >
                    <option value="signature">Signature</option>
                    <option value="classic">Classique</option>
                    <option value="soft">Sans Alcool</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-primary-gold text-black font-bold hover:bg-primary-gold-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    editingId ? "Modifier" : "Ajouter"
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
