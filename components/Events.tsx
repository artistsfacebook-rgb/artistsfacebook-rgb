
import React, { useState } from 'react';
import { Event } from '../types';
import { Calendar, MapPin, Star, Share2, Plus, Wand2 } from 'lucide-react';
import { generateDescription } from '../services/geminiService';

const MOCK_EVENTS: Event[] = [
  { id: 'ev1', title: 'Mumbai Art Fair 2024', date: 'OCT 15', location: 'BKC Grounds, Mumbai', type: 'In-Person', interestedCount: 1200, host: 'Art India', image: 'https://picsum.photos/800/400?random=20' },
  { id: 'ev2', title: 'Digital Painting Workshop', date: 'NOV 02', location: 'Online (Zoom)', type: 'Online', interestedCount: 450, host: 'Rohan Gupta', image: 'https://picsum.photos/800/400?random=21' },
];

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventLoc, setEventLoc] = useState('');
  
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
                             <button className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors">
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
                            onClick={() => {
                                const newEv: Event = {
                                    id: `ev${Date.now()}`,
                                    title: eventTitle,
                                    location: eventLoc,
                                    date: 'TBD',
                                    image: `https://picsum.photos/800/400?random=${Date.now()}`,
                                    interestedCount: 1,
                                    type: 'In-Person',
                                    host: 'You'
                                };
                                setEvents([newEv, ...events]);
                                setShowCreate(false);
                                setEventTitle('');
                                setEventLoc('');
                            }} 
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
