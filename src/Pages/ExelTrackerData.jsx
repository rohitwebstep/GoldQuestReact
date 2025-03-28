import React from 'react'
import Sidebar from '../Sidebar/Sidebar'
import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '../Sidebar/SidebarContext.jsx';
import ExelTrackerStatus from './ExelTrackerStatus';
const ExelTrackerData = () => {
  return (
   <>
   <SidebarProvider>
   <div className="flex flex-col md:flex-row">
    <ExelTrackerStatus/>
   </div>
   <Outlet/>
 </SidebarProvider>

  
   </>
  )
}

export default ExelTrackerData
