import React from 'react'
import AdminHeader from '../components/admin/AdminHeader'
import AdminSystemMetrics from '../components/admin/AdminSystemMetrics'
import ModelVersions from '../components/admin/ModelVersions'
import NetworkTopology from '../components/admin/NetworkTopology'
import RecentDatasetsTable from '../components/admin/RecentDatasetsTable'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import Navbar from '../components/Navbar'

const AdminDashboard = () => {
    return (
        <div className="flex min-h-screen flex-col bg-[#0b0e14] text-white">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar />
                <main className="flex-1 space-y-6 overflow-y-auto p-6">
                    <AdminHeader />
                    <AdminSystemMetrics />
                    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-5">
                            <ModelVersions />
                            <RecentDatasetsTable />
                        </div>
                        <NetworkTopology />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AdminDashboard