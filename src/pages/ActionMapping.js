import React from 'react';
import { 
  MousePointer, Zap, ShieldCheck, Volume2, PlayCircle, 
  ChevronRight, ChevronLeft, Layout, Move, MousePointer2 
} from 'lucide-react';

const ActionMapping = () => {
  const mappings = [
    // --- MOUSE CONTROL (Special Category) ---
    { gesture: 'Index Finger Up', action: 'Move Cursor', icon: <Move className="text-blue-400" />, category: 'Mouse' },
    { gesture: 'Index + Thumb Pinch', action: 'Left Click', icon: <MousePointer2 className="text-blue-400" />, category: 'Mouse' },
    
    // --- MEDIA CONTROLS ---
    { gesture: 'Palm_Open', action: 'Play / Pause', icon: <PlayCircle className="text-emerald-400" />, category: 'Media' },
    { gesture: 'Thumb_Up', action: 'Volume Up', icon: <Volume2 className="text-indigo-400" />, category: 'Media' },
    { gesture: 'Thumb_Down', action: 'Volume Down', icon: <Volume2 className="text-red-400" />, category: 'Media' },
    { gesture: 'Fist', action: 'Mute (Boss Key)', icon: <ShieldCheck className="text-red-500" />, category: 'Media' },
    
    // --- NAVIGATION & OS ---
    { gesture: 'Peace', action: 'Next Tab (Ctrl+Tab)', icon: <Zap className="text-amber-400" />, category: 'OS' },
    { gesture: 'Three_Fingers', action: 'Prev Tab (Shift+Ctrl+Tab)', icon: <Layout className="text-purple-400" />, category: 'OS' },
    { gesture: 'Swipe_L', action: 'Desktop Left', icon: <ChevronLeft className="text-pink-400" />, category: 'OS' },
    { gesture: 'Swipe_R', action: 'Desktop Right', icon: <ChevronRight className="text-pink-400" />, category: 'OS' },
  ];

  return (
    <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl shadow-indigo-500/30">
            <MousePointer size={28}/>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tight">
              Action <span className="text-indigo-500 not-italic">Mapping</span>
            </h1>
            <p className="text-slate-500 font-medium">Core system blueprints and neural triggers.</p>
          </div>
        </div>
        <div className="hidden md:block bg-slate-800/50 px-6 py-2 rounded-2xl border border-slate-700">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Model: </span>
          <span className="text-indigo-400 text-xs font-black uppercase">v3.0-Flash</span>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-[#161b22] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/80 border-b border-slate-800">
            <tr>
              <th className="p-6 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">Physical Gesture</th>
              <th className="p-6 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">System Command</th>
              <th className="p-6 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] text-right">Core Status</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {mappings.map((m, idx) => (
              <tr 
                key={m.gesture} 
                className={`border-b border-slate-800/50 hover:bg-indigo-500/5 transition-all group`}
              >
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold tracking-tight group-hover:text-indigo-400 transition-colors">
                      {m.gesture.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{m.category}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-3 text-indigo-100 font-bold bg-slate-800/50 w-fit px-5 py-3 rounded-2xl border border-slate-700 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-all">
                    {m.icon}
                    {m.action}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full uppercase font-black tracking-tighter border border-emerald-500/20">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                      Ready
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase mr-2">Default</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER TIP */}
      <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-3xl p-6 flex items-center gap-4">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
          <Zap size={20} />
        </div>
        <p className="text-slate-400 text-sm">
          <strong className="text-slate-200 uppercase text-xs">Pro Tip:</strong> You can override these defaults by creating a 
          <span className="text-indigo-400 font-bold"> Custom Gesture</span> with the same name in the Library page.
        </p>
      </div>
    </div>
  );
};

export default ActionMapping;