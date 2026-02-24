import React from "react";
import { FaCog, FaUserCircle } from "react-icons/fa";

const Header = ({ title }) => {
  return (
    <div className="h-16 border-b border-slate-800 bg-pageBg flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      
      <div className="flex items-center gap-6">
        {/* Status Indicator seen in Screenshot 171 */}
        <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
          <span className="text-[10px] font-medium text-success uppercase tracking-wider">System Active</span>
        </div>
        
        <div className="flex items-center gap-4 text-slate-400">
          <FaCog className="cursor-pointer hover:text-white transition-colors" />
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
            <FaUserCircle size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;