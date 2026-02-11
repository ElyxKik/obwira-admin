"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  TrendingUp, 
  Activity,
  BedDouble,
  Utensils,
  Car
} from "lucide-react";

// Interface pour les données unifiées
interface DashboardItem {
  id: string;
  type: 'room' | 'restaurant' | 'shuttle';
  status?: string;
  createdAt?: any;
  [key: string]: any;
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    todayBookings: 0,
    activeGuests: 0
  });
  const [recentActivity, setRecentActivity] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchStats();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch all collections
      const roomsSnap = await getDocs(collection(db, "bookings"));
      const restoSnap = await getDocs(collection(db, "restaurant_bookings"));
      const shuttleSnap = await getDocs(collection(db, "shuttle_bookings"));

      if (!isMounted.current) return;

      const allDocs: DashboardItem[] = [
        ...roomsSnap.docs.map(d => ({ ...d.data(), type: 'room', id: d.id } as DashboardItem)),
        ...restoSnap.docs.map(d => ({ ...d.data(), type: 'restaurant', id: d.id } as DashboardItem)),
        ...shuttleSnap.docs.map(d => ({ ...d.data(), type: 'shuttle', id: d.id } as DashboardItem))
      ];

      // Calculate Stats
      const total = allDocs.length;
      const pending = allDocs.filter(d => d.status === 'pending' || d.status === 'en attente').length;
      
      // Today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = allDocs.filter(d => {
        if (!d.createdAt) return false;
        const date = d.createdAt.toDate();
        return date >= today;
      }).length;

      // Invités Actifs (Calcul réel)
      const now = new Date();
      const activeBookings = allDocs.filter(d => {
        if (d.type !== 'room' || (d.status !== 'confirmed' && d.status !== 'confirmé')) return false;
        const checkIn = d.checkInDate?.toDate() || d.checkIn?.toDate();
        const checkOut = d.checkOutDate?.toDate() || d.checkOut?.toDate();
        if (!checkIn || !checkOut) return false;
        return now >= checkIn && now <= checkOut;
      });
      
      const activeGuestCount = activeBookings.reduce((acc, curr) => acc + (curr.guests || 0), 0);

      if (isMounted.current) {
        setStats({
          totalBookings: total,
          pendingBookings: pending,
          todayBookings: todayCount,
          activeGuests: activeGuestCount
        });

        // Recent Activity
        const sorted = allDocs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setRecentActivity(sorted.slice(0, 5));
      }

    } catch (error) {
      if (isMounted.current) console.error("Error fetching stats:", error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };
  
  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-secondary-black p-6 rounded-2xl border border-white/5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-bl-full -mr-4 -mt-4`} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 bg-${color}-500/20 rounded-xl text-${color}-400`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white font-playfair">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-playfair mb-2">Tableau de bord</h1>
          <p className="text-gray-400">Bienvenue sur votre espace d'administration Obwira.</p>
        </div>
        <button 
          onClick={fetchStats} 
          className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white transition-colors"
        >
          <Activity className="w-5 h-5" />
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Réservations" 
          value={stats.totalBookings} 
          icon={CalendarCheck} 
          color="blue" 
          trend="+12%"
        />
        <StatCard 
          title="En Attente" 
          value={stats.pendingBookings} 
          icon={Clock} 
          color="yellow" 
        />
        <StatCard 
          title="Réservations Aujourd'hui" 
          value={stats.todayBookings} 
          icon={TrendingUp} 
          color="green" 
          trend="+5%"
        />
        <StatCard 
          title="Invités Actifs" 
          value={stats.activeGuests} 
          icon={Users} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-secondary-black rounded-2xl p-6 border border-white/5">
          <h3 className="text-xl font-bold text-white font-playfair mb-6">Activité Récente</h3>
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary-gold/30 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.type === 'room' ? 'bg-blue-500/20 text-blue-400' :
                  item.type === 'restaurant' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {item.type === 'room' ? <BedDouble className="w-5 h-5" /> :
                   item.type === 'restaurant' ? <Utensils className="w-5 h-5" /> :
                   <Car className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">
                    {item.type === 'room' ? 'Réservation Chambre' :
                     item.type === 'restaurant' ? 'Réservation Table' :
                     'Navette VIP'}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {item.createdAt?.toDate().toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})} • {item.status}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    item.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    item.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution (Placeholder for Chart) */}
        <div className="bg-secondary-black rounded-2xl p-6 border border-white/5">
          <h3 className="text-xl font-bold text-white font-playfair mb-6">Répartition</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Chambres</span>
                <span>{Math.round((recentActivity.filter(i => i.type === 'room').length / recentActivity.length || 0) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Restaurant</span>
                <span>30%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Navettes</span>
                <span>25%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            
            <div className="p-4 bg-primary-gold/10 rounded-xl border border-primary-gold/20 mt-8">
              <p className="text-primary-gold text-sm text-center">
                Le service le plus populaire aujourd'hui est <strong>Le Restaurant</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
