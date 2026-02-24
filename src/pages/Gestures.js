import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Fingerprint, Plus, RefreshCw, Loader2, RotateCcw, X } from 'lucide-react';

// Centralizing defaults to match the expected backend labels
const PRETRAINED_DEFAULTS = [
  "Palm_Open", "Fist", "Thumb_Up", "Thumb_Down", 
  "Pointer", "Pinch", "Peace", "Three_Fingers", 
  "Swipe_L", "Swipe_R"
];

const Gestures = () => {
  const [gestures, setGestures] = useState([]);
  const [customGestures, setCustomGestures] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGestureData, setNewGestureData] = useState({ name: '', action: 'playpause' });
  const navigate = useNavigate();

  const fetchGestures = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/gestures/list');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      // Normalize comparison to prevent case-mismatch issues
      const backendGestures = data.gestures || [];
      const lowerDefaults = PRETRAINED_DEFAULTS.map(d => d.toLowerCase());
      
      // Filter out backend gestures that are already in defaults (by name)
      const uniqueCustom = backendGestures.filter(
        g => !lowerDefaults.includes(g.toLowerCase())
      );

      setGestures([...PRETRAINED_DEFAULTS, ...uniqueCustom]);
      setCustomGestures(data.custom_gestures || uniqueCustom);
    } catch (err) {
      console.error("Backend unreachable. Using local defaults.");
      setGestures(PRETRAINED_DEFAULTS);
      setCustomGestures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGestures(); }, []);

  const handleStartTraining = async () => {
    const { name, action } = newGestureData;
    
    if (!name.trim()) {
      return alert("Please enter a name for the gesture.");
    }

    // Standardize naming: underscore for spaces, lowercase for matching
    const formattedName = name.trim().replace(/\s+/g, '_');

    try {
      const res = await fetch('http://localhost:8000/gestures/set_mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: formattedName, action: action })
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Navigate to training with the exact name the backend expects
        navigate('/training', { 
          state: { 
            newGesture: formattedName, 
            limit: 400 
          } 
        });
      } else {
        const errorData = await res.json();
        alert(`Server Error: ${errorData.detail || "Failed to set mapping"}`);
      }
    } catch (err) {
      console.error("Navigation Error:", err);
      alert("Network Error: Ensure FastAPI is running on Port 8000.");
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Permanently delete all data for "${name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/gestures/delete/${name}`, { method: 'DELETE' });
      if (res.ok) {
        // Immediately refresh list after deletion
        fetchGestures();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="p-10 text-white min-h-screen bg-[#0d1117] relative font-sans">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight italic uppercase">
            Gesture Pro <span className="text-indigo-500 text-2xl not-italic">Library</span>
          </h1>
          <p className="text-gray-400 mt-2">Manage physical triggers and AI mappings.</p>
        </div>
        
        <div className="flex gap-4">
          <button onClick={fetchGestures} className="flex items-center gap-2 bg-gray-800 text-gray-300 border border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-700 transition-all">
            <RotateCcw size={18} /><span>Sync</span>
          </button>
          <button onClick={() => navigate('/training')} className="flex items-center gap-2 bg-amber-600/10 text-amber-500 border border-amber-600/20 px-4 py-2 rounded-xl hover:bg-amber-600/20 transition-all">
            <RefreshCw size={18} /><span>Retrain AI</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
            <Plus size={20} /><span>New Gesture</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gestures.map((g) => {
            // Updated custom check to handle case-insensitive matches with defaults
            const isCustom = !PRETRAINED_DEFAULTS.some(d => d.toLowerCase() === g.toLowerCase());
            
            return (
              <div key={g} className="bg-[#161b22] p-6 rounded-[2rem] border border-gray-800 flex justify-between items-center group hover:border-indigo-500/50 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${isCustom ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
                    <Fingerprint className={isCustom ? 'text-purple-400' : 'text-indigo-400'} size={24} />
                  </div>
                  <div>
                    <span className="text-xl font-bold block capitalize tracking-tight">{g.replace(/_/g, ' ')}</span>
                    <span className={`text-[10px] uppercase font-black tracking-widest ${isCustom ? 'text-purple-500' : 'text-gray-500'}`}>
                      {isCustom ? "Custom AI Model" : "Core System Default"}
                    </span>
                  </div>
                </div>

                {isCustom && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(g); }} 
                    className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex justify-center items-center p-4">
          <div className="bg-[#1c2128] border border-gray-700 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic">NEW TRIGGER</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2 bg-white/5 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">Gesture Alias</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Double Click"
                  value={newGestureData.name}
                  onChange={(e) => setNewGestureData({...newGestureData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">Neural Action Mapping</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                    onChange={(e) => setNewGestureData({...newGestureData, action: e.target.value})}
                    value={newGestureData.action}
                  >
                    <optgroup label="Media Controls" className='bg-[#1c2128]'>
                      <option value="playpause">Play / Pause</option>
                      <option value="nexttrack">Next Track</option>
                      <option value="prevtrack">Previous Track</option>
                      <option value="volumemute">Mute System</option>
                    </optgroup>
                    <optgroup label="OS Shortcuts" className='bg-[#1c2128]'>
                      <option value="space">Spacebar</option>
                      <option value="enter">Enter Key</option>
                      <option value="esc">Escape</option>
                      <option value="f11">Fullscreen (F11)</option>
                    </optgroup>
                    <optgroup label="Browser" className='bg-[#1c2128]'>
                      <option value="f5">Refresh Page</option>
                      <option value="browserback">Go Back</option>
                      <option value="browserforward">Go Forward</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleStartTraining}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
              >
                INITIALIZE 400-FRAME CAPTURE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gestures;