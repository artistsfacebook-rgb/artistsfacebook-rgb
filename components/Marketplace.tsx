
import React from 'react';
import { Product } from '../types';
import { ShoppingCart, Tag, Filter } from 'lucide-react';

const PRODUCTS: Product[] = [
  {
    id: 'prod1',
    artistId: 'u1',
    artist: { id: 'u1', name: 'Aarav Patel', handle: '@aarav_art', avatar: 'https://picsum.photos/100/100?random=1', type: 'Artist', location: 'Mumbai', followingIds: [] },
    title: 'Monsoon Abstract #4',
    image: 'https://picsum.photos/400/400?random=30',
    price: 12000,
    description: 'Acrylic on Canvas, 24x24 inches. Signed by artist.'
  },
  {
    id: 'prod2',
    artistId: 'u2',
    artist: { id: 'u2', name: 'Priya Singh', handle: '@priya_colors', avatar: 'https://picsum.photos/100/100?random=2', type: 'Artist', location: 'Delhi', followingIds: [] },
    title: 'Golden Temple Sketch',
    image: 'https://picsum.photos/400/400?random=31',
    price: 4500,
    description: 'Charcoal sketch on archival paper. Framed.'
  },
  {
    id: 'prod3',
    artistId: 'u4',
    artist: { id: 'u4', name: 'Urban Art Collective', handle: '@urban_co', avatar: 'https://picsum.photos/100/100?random=8', type: 'Artist', location: 'Pune', followingIds: [] },
    title: 'Digital Print: Neon City',
    image: 'https://picsum.photos/400/400?random=32',
    price: 2500,
    description: 'High quality giclee print. Limited edition 5/50.'
  }
];

const Marketplace: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Art Marketplace</h2>
            <p className="text-gray-500 text-sm">Support independent Indian artists</p>
        </div>
        <button className="bg-white border border-gray-200 p-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm">
            <Filter size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map(product => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden group border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                    <span className="bg-white/90 text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-sm backdrop-blur-sm">
                        For Sale
                    </span>
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                    <img src={product.artist.avatar} className="w-6 h-6 rounded-full border border-gray-200" alt={product.artist.name} />
                    <span className="text-xs text-gray-500">{product.artist.name}</span>
                </div>
                <h3 className="font-bold text-lg mb-1 truncate text-gray-900">{product.title}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5em]">{product.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <span className="text-xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                    <button className="bg-pink-600 p-2.5 rounded-full text-white hover:bg-pink-700 transition-transform hover:scale-110 shadow-lg shadow-pink-200">
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
