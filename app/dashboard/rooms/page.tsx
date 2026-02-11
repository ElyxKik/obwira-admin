"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Edit, Hotel } from "lucide-react";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
  price: number;
  pricePerNight?: number;
  description: string;
  imageUrl?: string;
  images?: string[];
  amenities: string[];
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "rooms"));
      const roomsData: Room[] = [];
      snapshot.forEach((doc) => {
        roomsData.push({ id: doc.id, ...doc.data() } as Room);
      });
      setRooms(roomsData);
    } catch (error) {
      console.error("Erreur lors de la récupération des chambres:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette chambre ?")) return;

    try {
      await deleteDoc(doc(db, "rooms", id));
      setRooms(rooms.filter((room) => room.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold font-playfair">Gestion des Chambres</h2>
        <Link
          href="/dashboard/rooms/new"
          className="bg-primary-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-gold-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter une chambre
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            // Détermination de l'image à afficher (nouveau ou ancien format)
            const displayImage = (room.images && room.images.length > 0) ? room.images[0] : room.imageUrl;
            // Détermination du prix à afficher (nouveau ou ancien format)
            const displayPrice = room.pricePerNight ?? room.price;

            return (
              <div
                key={room.id}
                className="bg-secondary-black rounded-xl overflow-hidden border border-white/10 group hover:border-primary-gold/50 transition-colors"
              >
                <div className="h-48 bg-gray-800 relative">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Hotel className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-primary-gold font-bold border border-primary-gold/30">
                    {displayPrice ?? 'N/A'}$ / nuit
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-playfair text-xl font-bold mb-2">{room.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {room.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities?.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="text-xs bg-white/5 px-2 py-1 rounded border border-white/10 text-gray-300">
                        {amenity}
                      </span>
                    ))}
                    {(room.amenities?.length || 0) > 3 && (
                      <span className="text-xs px-2 py-1 text-gray-500">+{room.amenities!.length - 3}</span>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                    <Link
                      href={`/dashboard/rooms/${room.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </Link>
                    <button 
                      onClick={() => handleDelete(room.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {rooms.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-secondary-black rounded-xl border border-white/5">
              Aucune chambre trouvée. Commencez par en ajouter une !
            </div>
          )}
        </div>
      )}
    </div>
  );
}
