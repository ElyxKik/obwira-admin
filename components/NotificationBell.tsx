"use client";

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, limit } from 'firebase/firestore';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    // Son de notification doux
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const q = query(
      collection(db, 'notifications'),
      where('targetRole', '==', 'admin')
      // orderBy('createdAt', 'desc'), // Désactivé pour éviter l'erreur d'index
      // limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Tri côté client
      items.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      // Limite côté client
      items = items.slice(0, 20);

      const unread = items.filter((i: any) => !i.read).length;
      
      // Jouer le son seulement si ce n'est pas le premier chargement et qu'il y a une nouvelle notif
      if (!firstLoad.current && unread > unreadCount) {
        audioRef.current?.play().catch(() => {});
      }
      
      setUnreadCount(unread);
      setNotifications(items);
      firstLoad.current = false;
    });

    return () => unsubscribe();
  }, [unreadCount]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error("Error marking as read", e);
    }
  };

  const markAllAsRead = async () => {
    notifications.forEach(n => {
      if (!n.read) markAsRead(n.id);
    });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#2D2D2D] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1A1A1A]">
            <h3 className="font-bold text-white font-playfair">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary-gold hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-[#D4AF37]/10' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-bold ${!notif.read ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-gray-500">
                      {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Overlay pour fermer en cliquant à côté */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
