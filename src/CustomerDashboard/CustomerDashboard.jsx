import React from 'react'
import Sidebar from './Sidebar'
import { SidebarProvider } from './SidebarContext'

const CustomerDashboard = () => {
    return (
        <>
        <SidebarProvider>

         <Sidebar/>

        </SidebarProvider>
        </>
    )
}

export default CustomerDashboard