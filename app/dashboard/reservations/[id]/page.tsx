"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  Mail,
  Clock,
  CreditCard
} from "lucide-react";
import Link from "next/link";

interface BookingDetail {
  id: string;
  [key: string]: any;
}

export default function ReservationDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'room'; // room, restaurant, shuttle
  const router = useRouter();
  
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      // Déterminer la collection
      let collectionName = "bookings"; // room
      if (type === 'restaurant') collectionName = "restaurant_bookings";
      if (type === 'shuttle') collectionName = "shuttle_bookings";

      const docRef = doc(db, collectionName, id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setBooking({ id: docSnap.id, ...data });

        // Récupérer les infos utilisateur si userId existe
        if (data.userId) {
          const userRef = doc(db, "users", data.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser(userSnap.data());
          }
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;

    let collectionName = "bookings";
    if (type === 'restaurant') collectionName = "restaurant_bookings";
    if (type === 'shuttle') collectionName = "shuttle_bookings";

    try {
      await updateDoc(doc(db, collectionName, booking.id), {
        status: newStatus
      });
      setBooking({ ...booking, status: newStatus });
      alert(`Réservation ${newStatus === 'confirmed' ? 'confirmée' : 'annulée'} avec succès`);
    } catch (error) {
      console.error("Erreur update:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-white">Réservation introuvable</h2>
        <Link href="/dashboard/reservations" className="text-primary-gold hover:underline mt-4 block">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/dashboard/reservations" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux réservations
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-playfair text-white">
              {user ? `Réservation de ${user.fullName || 'Client'}` : 'Chargement...'}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
              {booking.status || 'En attente'}
            </span>
          </div>
          <p className="text-gray-400 text-sm">ID: <span className="font-mono">{booking.id}</span></p>
        </div>

        <div className="flex gap-3">
          {booking.status !== 'confirmed' && (
            <button
              onClick={() => handleStatusUpdate('confirmed')}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Confirmer
            </button>
          )}
          {booking.status !== 'cancelled' && (
            <button
              onClick={() => handleStatusUpdate('cancelled')}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 font-bold rounded-xl border border-red-500/50 hover:bg-red-500/20 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Annuler
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Client */}
        <div className="bg-secondary-black rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold font-playfair text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-gold" />
            Client
          </h2>
          
          {user ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Nom complet</p>
                <p className="text-white font-medium text-lg">{user.fullName || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <div className="flex items-center gap-2 text-white">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {user.email}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Statut membre</p>
                <p className="text-primary-gold">{user.memberStatus || 'Classic'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 italic">Informations utilisateur non disponibles</p>
          )}
        </div>

        {/* Détails Réservation */}
        <div className="bg-secondary-black rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold font-playfair text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-gold" />
            Détails
          </h2>

          <div className="space-y-4">
            {type === 'room' && (
              <>
                <div>
                  <p className="text-sm text-gray-400">Chambre</p>
                  <p className="text-white font-medium text-lg">{booking.roomName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Arrivée</p>
                    <p className="text-white">{booking.checkIn?.toDate().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Départ</p>
                    <p className="text-white">{booking.checkOut?.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Prix total</p>
                  <p className="text-primary-gold font-bold text-xl">{booking.totalPrice}$</p>
                </div>
              </>
            )}

            {type === 'restaurant' && (
              <>
                <div>
                  <p className="text-sm text-gray-400">Date & Heure</p>
                  <div className="flex items-center gap-2 text-white font-medium text-lg">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {booking.bookingDate?.toDate().toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Couverts</p>
                    <p className="text-white">{booking.guests} personnes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Préférence</p>
                    <p className="text-white capitalize">{booking.preference}</p>
                  </div>
                </div>
                {booking.allergies && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400 font-bold mb-1">ALLERGIES / DEMANDES</p>
                    <p className="text-sm text-white">{booking.allergies}</p>
                  </div>
                )}
              </>
            )}

            {type === 'shuttle' && (
              <>
                <div>
                  <p className="text-sm text-gray-400">Date & Heure</p>
                  <div className="flex items-center gap-2 text-white font-medium text-lg">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {booking.scheduledTime?.toDate().toLocaleString()}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Trajet</p>
                  <p className="text-white font-medium">
                    {booking.tripType === 'airport_to_hotel' ? 'Aéroport ➔ Hôtel' : 'Hôtel ➔ Aéroport'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Passagers</p>
                    <p className="text-white">{booking.passengers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Bagages</p>
                    <p className="text-white">{booking.luggage}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Numéro de vol</p>
                  <p className="text-white font-mono bg-white/5 px-2 py-1 rounded w-fit">
                    {booking.flightNumber || 'N/A'}
                  </p>
                </div>
              </>
            )}
            
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400">Réservé le</p>
              <p className="text-white text-sm">{booking.createdAt?.toDate().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
