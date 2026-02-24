import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = ({ children, active, setActive }) => {
  return (
    <div className="flex h-screen bg-pageBg text-white overflow-hidden">
      {/* Pass setActive here */}
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={active} />
        <main className="p-8 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;