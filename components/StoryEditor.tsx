
import React, { useState } from 'react';
import { X, Type, Music, Palette, Check, Lock, Globe } from 'lucide-react';

interface StoryEditorProps {
    file: File | string;
    onSave: (storyData: { file: string, filter: string, text: any, privacy: string, isVideo: boolean }) => void;
    onCancel: () => void;
}

const FILTERS = [
    { name: 'Normal', class: '' },
    { name: 'Vivid', class: 'saturate-150 contrast-110' },
    { name: 'B&W', class: 'grayscale contrast-125' },
    { name: 'Sepia', class: 'sepia contrast-90' },
    { name: 'Vintage', class: 'sepia-50 hue-rotate-15' },
];

const StoryEditor: React.FC<StoryEditorProps> = ({ file, onSave, onCancel }) => {
    const [previewUrl, setPreviewUrl] = useState<string>(typeof file === 'string' ? file : URL.createObjectURL(file));
    const isVideo = typeof file !== 'string' && file.type.startsWith('video/');
    
    const [selectedFilter, setSelectedFilter] = useState('');
    const [textOverlay, setTextOverlay] = useState<{text: string, color: string, y: number} | null>(null);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [privacy, setPrivacy] = useState('Public');

    const handleAddText = () => {
        if (textInput.trim()) {
            setTextOverlay({ text: textInput, color: 'white', y: 50 });
            setShowTextInput(false);
            setTextInput('');
        }
    };

    const handlePost = () => {
        // If it's a File object, we'd normally compress it here. 
        // For simplicity passing the preview URL or original string if already base64
        onSave({
            file: previewUrl,
            filter: selectedFilter,
            text: textOverlay,
            privacy,
            isVideo
        });
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col">
             {/* Header */}
             <div className="flex justify-between items-center p-4 text-white z-20">
                 <button onClick={onCancel}><X size={28} /></button>
                 <div className="font-bold">Create Story</div>
                 <button onClick={() => setPrivacy(privacy === 'Public' ? 'Friends' : 'Public')} className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full text-sm">
                     {privacy === 'Public' ? <Globe size={14} /> : <Lock size={14} />} {privacy}
                 </button>
             </div>

             {/* Main Canvas */}
             <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-900">
                 <div className={`relative w-full max-w-md h-full md:h-[90%] aspect-[9/16] ${selectedFilter}`}>
                     {isVideo ? (
                         <video src={previewUrl} className="w-full h-full object-cover" autoPlay loop playsInline />
                     ) : (
                         <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                     )}
                     
                     {/* Text Overlay */}
                     {textOverlay && (
                         <div 
                            className="absolute w-full text-center font-bold text-2xl drop-shadow-lg break-words px-4 pointer-events-none" 
                            style={{ top: `${textOverlay.y}%`, color: textOverlay.color }}
                         >
                             {textOverlay.text}
                         </div>
                     )}
                 </div>
             </div>

             {/* Controls */}
             <div className="bg-black p-4 pb-8 z-20">
                 {showTextInput ? (
                     <div className="flex gap-2 mb-4">
                         <input 
                            autoFocus
                            type="text" 
                            value={textInput}
                            onChange={e => setTextInput(e.target.value)}
                            placeholder="Add text..."
                            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full outline-none"
                         />
                         <button onClick={handleAddText} className="bg-blue-600 p-2 rounded-full text-white"><Check /></button>
                     </div>
                 ) : (
                     <div className="flex justify-center gap-6 mb-6">
                         <button onClick={() => setShowTextInput(true)} className="flex flex-col items-center text-white gap-1">
                             <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center"><Type size={20} /></div>
                             <span className="text-xs">Text</span>
                         </button>
                         <button className="flex flex-col items-center text-white gap-1 opacity-50">
                             <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center"><Music size={20} /></div>
                             <span className="text-xs">Music</span>
                         </button>
                     </div>
                 )}

                 {/* Filters */}
                 <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 px-2">
                     {FILTERS.map(f => (
                         <button 
                            key={f.name}
                            onClick={() => setSelectedFilter(f.class)}
                            className={`flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 ${selectedFilter === f.class ? 'border-blue-500' : 'border-transparent'}`}
                         >
                             <div className={`w-full h-full bg-gray-500 flex items-center justify-center text-xs text-white font-bold ${f.class} bg-cover`} style={{backgroundImage: `url(${previewUrl})`}}>
                                 {!isVideo && <span className="drop-shadow-md">{f.name}</span>}
                             </div>
                         </button>
                     ))}
                 </div>

                 <button onClick={handlePost} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700">
                     Share to Story
                 </button>
             </div>
        </div>
    );
};

export default StoryEditor;
