import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '../Sidebar/SidebarContext.jsx';
import MainContent from './MainContent';
import Header from '../Dashboard/Header'; // Header component

const Render = () => {
  return (
    <SidebarProvider>
         <Header />
      <div className="flex flex-col md:flex-row">
        <Sidebar />
        <MainContent />
      </div>
      <Outlet />
    </SidebarProvider>
  );
};

export default Render;
