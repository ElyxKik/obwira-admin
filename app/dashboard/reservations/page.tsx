"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Coffee,
  Car,
  Bed
} from "lucide-react";

interface Booking {
  id: string;
  type: 'room' | 'restaurant' | 'shuttle';
  status: string;
  userId: string;
  createdAt: any;
  details: any;
}

export default function ReservationsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchBookings();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const allBookings: Booking[] = [];

      // 1. Réservations de chambres
      const roomSnapshot = await getDocs(query(collection(db, "bookings"), orderBy("createdAt", "desc")));
      roomSnapshot.forEach(doc => {
        allBookings.push({
          id: doc.id,
          type: 'room',
          status: doc.data().status || 'pending',
          userId: doc.data().userId,
          createdAt: doc.data().createdAt,
          details: doc.data()
        });
      });

      // 2. Restaurant
      const restaurantSnapshot = await getDocs(query(collection(db, "restaurant_bookings"), orderBy("createdAt", "desc")));
      restaurantSnapshot.forEach(doc => {
        allBookings.push({
          id: doc.id,
          type: 'restaurant',
          status: doc.data().status || 'pending',
          userId: doc.data().userId,
          createdAt: doc.data().createdAt,
          details: doc.data()
        });
      });

      // 3. Navette
      const shuttleSnapshot = await getDocs(query(collection(db, "shuttle_bookings"), orderBy("createdAt", "desc")));
      shuttleSnapshot.forEach(doc => {
        allBookings.push({
          id: doc.id,
          type: 'shuttle',
          status: doc.data().status || 'pending',
          userId: doc.data().userId,
          createdAt: doc.data().createdAt,
          details: doc.data()
        });
      });

      // Tri global par date
      allBookings.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      if (isMounted.current) {
        setBookings(allBookings);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error("Erreur fetch:", error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleStatusUpdate = async (id: string, type: string, newStatus: string) => {
    let collectionName = "bookings";
    if (type === 'restaurant') collectionName = "restaurant_bookings";
    if (type === 'shuttle') collectionName = "shuttle_bookings";

    try {
      await updateDoc(doc(db, collectionName, id), {
        status: newStatus
      });
      
      // Mettre à jour l'état local
      setBookings(prev => prev.map(b => 
        b.id === id ? { ...b, status: newStatus } : b
      ));
    } catch (error) {
      console.error("Erreur update:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleAction = (e: React.MouseEvent, id: string, type: string, status: string) => {
    e.stopPropagation();
    handleStatusUpdate(id, type, status);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'confirmé':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending':
      case 'en attente':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'cancelled':
      case 'annulé':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'room': return <Bed className="w-5 h-5" />;
      case 'restaurant': return <Coffee className="w-5 h-5" />;
      case 'shuttle': return <Car className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.type === filter);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-white font-playfair">Liste des Réservations</h2>
        
        <div className="flex gap-2 bg-secondary-black p-1 rounded-lg border border-white/10">
          {['all', 'room', 'restaurant', 'shuttle'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-primary-gold text-black' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f === 'all' ? 'Tout' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <div 
              key={booking.id}
              onClick={() => router.push(`/dashboard/reservations/${booking.id}?type=${booking.type}`)}
              className="bg-secondary-black rounded-xl p-6 border border-white/5 hover:border-primary-gold/30 transition-colors cursor-pointer"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    booking.type === 'room' ? 'bg-blue-500/20 text-blue-400' :
                    booking.type === 'restaurant' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {getTypeIcon(booking.type)}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">
                        {booking.type === 'room' ? booking.details.roomName || 'Chambre' :
                         booking.type === 'restaurant' ? `Table pour ${booking.details.guests}` :
                         'Navette VIP'}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-1">
                      Client: <span className="text-white font-medium">
                        {booking.details.customerName || booking.details.name || `Client ${booking.userId.slice(0, 4)}`}
                      </span>
                    </p>
                    
                    <div className="text-sm text-gray-400 flex flex-col gap-1">
                      {booking.type === 'room' && (
                        <>
                          <span className="text-primary-gold">
                            {booking.details.checkIn ? new Date(booking.details.checkIn.seconds * 1000).toLocaleDateString() : 'N/A'} 
                            {' ➔ '} 
                            {booking.details.checkOut ? new Date(booking.details.checkOut.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </span>
                        </>
                      )}
                      {booking.type === 'restaurant' && (
                        <>
                          <span className="text-primary-gold">
                            {booking.details.bookingDate ? new Date(booking.details.bookingDate.seconds * 1000).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'}) : 'N/A'}
                          </span>
                          <span>Préférence: {booking.details.preference}</span>
                        </>
                      )}
                      {booking.type === 'shuttle' && (
                        <>
                          <span className="text-primary-gold">
                            {booking.details.scheduledTime ? new Date(booking.details.scheduledTime.seconds * 1000).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'}) : 'N/A'}
                          </span>
                          <span>Trajet: {booking.details.tripType === 'airport_to_hotel' ? 'Aéroport -> Hôtel' : 'Hôtel -> Aéroport'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  {booking.status !== 'confirmed' && booking.status !== 'confirmé' && (
                    <button
                      onClick={(e) => handleAction(e, booking.id, booking.type, 'confirmed')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 border border-green-500/20 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Valider
                    </button>
                  )}
                  
                  {booking.status !== 'cancelled' && booking.status !== 'annulé' && (
                    <button
                      onClick={(e) => handleAction(e, booking.id, booking.type, 'cancelled')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-colors text-sm font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredBookings.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-secondary-black rounded-xl border border-white/5">
              Aucune réservation trouvée
            </div>
          )}
        </div>
      )}
    </>
  );
}
