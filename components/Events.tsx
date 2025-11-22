
import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { Calendar, MapPin, Star, Share2, Plus, Wand2, Check } from 'lucide-react';
import { generateDescription } from '../services/geminiService';
import { getEvents, createEvent, rsvpEvent } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';

const Events: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventLoc, setEventLoc] = useState('');
  
  useEffect(() => {
      const load = async () => {
          const data = await getEvents();
          setEvents(data);
      };
      load();
  }, [showCreate]);

  const handleRSVP = async (id: string) => {
      if(!user) return;
      await rsvpEvent(id, user.id, 'interested');
      // Optimistic update
      setEvents(events.map(e => e.id === id ? { ...e, interestedCount: e.interestedCount + 1 } : e));
  };

  const handleCreate = async () => {
      if (!user || !eventTitle) return;
      const newEv: Event = {
          id: `ev${Date.now()}`,
          title: eventTitle,
          location: eventLoc,
          date: 'OCT 15', // Placeholder
          image: `https://picsum.photos/800/400?random=${Date.now()}`,
          interestedCount: 1,
          type: 'In-Person',
          host: user.name
      };
      await createEvent(newEv);
      setEvents([newEv, ...events]);
      setShowCreate(false);
      setEventTitle('');
      setEventLoc('');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-gray-500 dark:text-slate-400">Workshops, exhibitions, and meetups.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-red-500/30">
            <Plus size={20} /> Create Event
        </button>
      </div>

      <div className="space-y-4">
         {events.map(event => (
             <div key={event.id} className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row">
                 <div className="md:w-48 h-48 md:h-auto relative bg-gray-200">
                    <img src={event.image} className="w-full h-full object-cover" alt="" />
                    <div className="absolute top-2 left-2 bg-white/90 text-black px-3 py-1 rounded-lg text-center shadow-sm">
                        <div className="text-xs font-bold text-red-500">{event.date.split(' ')[0]}</div>
                        <div className="text-xl font-bold">{event.date.split(' ')[1]}</div>
                    </div>
                 </div>
                 <div className="p-4 flex-1 flex flex-col justify-between">
                     <div>
                         <h3 className="text-xl font-bold mb-1">{event.title}</h3>
                         <div className="text-sm text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                             <MapPin size={14} /> {event.location}
                         </div>
                         <p className="text-sm text-gray-600 dark:text-slate-300">Hosted by <span className="font-semibold">{event.host}</span></p>
                     </div>
                     <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                         <div className="text-sm text-gray-500 dark:text-slate-400">
                             {event.interestedCount} people interested
                         </div>
                         <div className="flex gap-2">
                             <button onClick={() => handleRSVP(event.id)} className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors">
                                 <Star size={16} /> Interested
                             </button>
                             <button className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 px-3 rounded-lg transition-colors">
                                 <Share2 size={16} />
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
         ))}
      </div>
      
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#242526] w-full max-w-md rounded-xl shadow-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Create Event</h3>
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Event Name" 
                        className="w-full p-2 rounded-lg bg-gray-100 dark:bg-slate-800 focus:outline-none" 
                        value={eventTitle} onChange={e => setEventTitle(e.target.value)}
                    />
                    <input 
                        type="text" 
                        placeholder="Location" 
                        className="w-full p-2 rounded-lg bg-gray-100 dark:bg-slate-800 focus:outline-none" 
                        value={eventLoc} onChange={e => setEventLoc(e.target.value)}
                    />
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 font-semibold">Cancel</button>
                        <button 
                            onClick={handleCreate}
                            className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Events;
