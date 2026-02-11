"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { Plus, Trash2, UtensilsCrossed } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'breakfast' | 'starter' | 'main' | 'dessert';
}

export default function RestaurantPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("starter");

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "restaurant_menu"));
      const items: MenuItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setMenuItems(items);
    } catch (error) {
      console.error("Erreur fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "restaurant_menu"), {
        name,
        description,
        price: parseFloat(price),
        category,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setName("");
      setDescription("");
      setPrice("");
      fetchMenu();
    } catch (error) {
      console.error("Erreur ajout:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce plat ?")) return;
    try {
      await deleteDoc(doc(db, "restaurant_menu", id));
      setMenuItems(menuItems.filter(item => item.id !== id));
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const categories = {
    breakfast: "Petit Déjeuner",
    starter: "Entrées",
    main: "Plats",
    dessert: "Desserts"
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold font-playfair text-white">Menu du Restaurant</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-gold-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un plat
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.keys(categories) as Array<keyof typeof categories>).map((cat) => {
            const items = menuItems.filter(i => i.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} className="bg-secondary-black rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-primary-gold mb-4 font-playfair">{categories[cat]}</h3>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <div>
                        <h4 className="font-bold text-white">{item.name}</h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-primary-gold">{item.price}$</span>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'ajout */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-secondary-black p-8 rounded-2xl max-w-md w-full border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 font-playfair">Nouveau Plat</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Nom</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-primary-black border border-white/10 rounded-lg p-3 text-white focus:border-primary-gold outline-none"
                  required 
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-primary-black border border-white/10 rounded-lg p-3 text-white focus:border-primary-gold outline-none"
                  rows={2}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Prix ($)</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-primary-black border border-white/10 rounded-lg p-3 text-white focus:border-primary-gold outline-none"
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Catégorie</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-primary-black border border-white/10 rounded-lg p-3 text-white focus:border-primary-gold outline-none"
                  >
                    <option value="breakfast">Petit Déjeuner</option>
                    <option value="starter">Entrée</option>
                    <option value="main">Plat</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-primary-gold text-black font-bold hover:bg-primary-gold-dark"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
