
import React, { useState } from 'react';
import { Studio } from '../types';
import { MapPin, Star, Clock, Wifi, Music, Mic2, Search, CheckCircle } from 'lucide-react';
import { getStudioRecommendation } from '../services/geminiService';

const STUDIOS: Studio[] = [
  {
    id: 's1',
    name: 'Purple Haze Audio',
    image: 'https://picsum.photos/500/300?random=20',
    location: 'Bandra West, Mumbai',
    rating: 4.8,
    pricePerHour: 1500,
    equipment: ['Neumann U87', 'Pro Tools HD', 'Grand Piano'],
    available: true
  },
  {
    id: 's2',
    name: 'Canvas & Clay Studio',
    image: 'https://picsum.photos/500/300?random=21',
    location: 'Hauz Khas, Delhi',
    rating: 4.6,
    pricePerHour: 800,
    equipment: ['Easels', 'Kiln', 'Natural Light'],
    available: true
  },
  {
    id: 's3',
    name: 'Rhythm House',
    image: 'https://picsum.photos/500/300?random=22',
    location: 'Koramangala, Bangalore',
    rating: 4.9,
    pricePerHour: 2000,
    equipment: ['Drum Kit', 'Isolation Booth', 'Mixing Desk'],
    available: false
  }
];

const StudioBooking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [aiTip, setAiTip] = useState<string | null>(null);

  const handleSearch = async () => {
      if (searchTerm.length > 3) {
          const tip = await getStudioRecommendation(searchTerm);
          setAiTip(tip);
      }
  };

  const filteredStudios = STUDIOS.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-8 text-center relative overflow-hidden shadow-lg">
        <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2 text-white">Book Professional Studios</h2>
            <p className="text-blue-100 mb-6">Find the perfect space for your next masterpiece or recording session.</p>
            
            <div className="flex max-w-md mx-auto bg-white rounded-full overflow-hidden shadow-md">
                <input 
                    type="text" 
                    placeholder="Search by city or studio name..." 
                    className="flex-1 px-6 py-3 bg-transparent focus:outline-none text-gray-900 placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={handleSearch}
                />
                <button className="bg-purple-600 px-6 hover:bg-purple-700 transition-colors text-white flex items-center justify-center">
                    <Search size={20} />
                </button>
            </div>
            {aiTip && <p className="text-xs text-blue-200 mt-3 italic">✨ AI Insight: {aiTip}</p>}
        </div>
      </div>

      {/* Studios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredStudios.map(studio => (
          <div key={studio.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group">
            <div className="relative h-48 overflow-hidden">
                <img src={studio.image} alt={studio.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1 text-sm font-bold shadow-sm text-gray-900">
                    <Star size={14} className="text-yellow-500 fill-current" />
                    <span>{studio.rating}</span>
                </div>
            </div>
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{studio.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${studio.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {studio.available ? 'Available' : 'Booked'}
                    </span>
                </div>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin size={14} className="mr-1" />
                    {studio.location}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {studio.equipment.map(item => (
                        <span key={item} className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 font-medium">{item}</span>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Price per hour</span>
                        <span className="text-lg font-bold text-blue-600">₹{studio.pricePerHour}</span>
                    </div>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                        Book Now
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudioBooking;
