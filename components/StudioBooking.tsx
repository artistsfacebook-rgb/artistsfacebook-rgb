
import React, { useState } from 'react';
import { Studio } from '../types';
import { MapPin, Star, Search, Map } from 'lucide-react';
import { searchStudiosWithMaps, getStudioRecommendation } from '../services/geminiService';

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
  const [mapsResults, setMapsResults] = useState<any[]>([]);
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);

  const handleSearch = async () => {
      if (searchTerm.length > 3) {
          const tip = await getStudioRecommendation(searchTerm);
          setAiTip(tip);
      }
  };

  const handleMapsSearch = async () => {
      if (!searchTerm.trim()) return;
      setIsSearchingMaps(true);
      const { text, chunks } = await searchStudiosWithMaps(searchTerm);
      
      // Process chunks to display
      const results = chunks.map((chunk: any, index: number) => ({
          id: `map_${index}`,
          name: chunk.web?.title || "Studio Result",
          location: chunk.web?.uri || "Location from Maps",
          description: text.slice(0, 100) + "...", // Fallback snippet
          link: chunk.web?.uri
      }));
      
      // If we have structured web data, use it, otherwise show the text summary
      setAiTip(text); 
      setMapsResults(results);
      setIsSearchingMaps(false);
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
            
            <div className="flex flex-col md:flex-row gap-2 max-w-2xl mx-auto bg-white rounded-xl p-2 shadow-md">
                <input 
                    type="text" 
                    placeholder="Search by city or studio name..." 
                    className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-gray-900 placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={handleSearch}
                />
                <div className="flex gap-1">
                    <button onClick={handleSearch} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                        <Search size={18} /> Local
                    </button>
                    <button onClick={handleMapsSearch} disabled={isSearchingMaps} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-70">
                        {isSearchingMaps ? 'Searching...' : <><Map size={18} /> Google Maps</>}
                    </button>
                </div>
            </div>
            {aiTip && <div className="bg-white/10 backdrop-blur-sm mt-4 p-3 rounded-lg text-blue-100 text-sm text-left"><strong className="text-yellow-300">Gemini Info:</strong> {aiTip}</div>}
            
            {mapsResults.length > 0 && (
                <div className="mt-4 bg-white rounded-xl p-4 text-left shadow-lg">
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Map size={16} /> Live Results from Google Maps</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {mapsResults.map(res => (
                            <div key={res.id} className="p-2 border border-gray-100 rounded hover:bg-gray-50">
                                <a href={res.link} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline block">{res.name}</a>
                                <p className="text-xs text-gray-500 truncate">{res.location}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
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
