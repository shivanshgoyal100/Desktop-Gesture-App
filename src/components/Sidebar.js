import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Hand, Zap, BarChart3, Settings, BrainCircuit } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const menu = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20}/> },
    { name: 'Gestures', path: '/gestures', icon: <Hand size={20}/> },
    { name: 'Training', path: '/training', icon: <BrainCircuit size={20}/> },
    { name: 'Mapping', path: '/mapping', icon: <Zap size={20}/> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20}/> },
  ];

  return (
    <aside className="w-72 bg-[#0d1117] border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-10 flex items-center gap-4">
        <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20"><Hand size={22}/></div>
        <h1 className="text-2xl font-bold text-white tracking-tight">GesturePro</h1>
      </div>
      <nav className="flex-1 px-6 space-y-2">
        {menu.map((item) => (
          <Link key={item.path} to={item.path} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${location.pathname === item.path ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
            {item.icon} <span className="font-semibold">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};
export default Sidebar;