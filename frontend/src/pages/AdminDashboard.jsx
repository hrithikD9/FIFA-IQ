import React, { useEffect, useState } from 'react'
import AdminHeader from '../components/admin/AdminHeader'
import AdminSystemMetrics from '../components/admin/AdminSystemMetrics'
import ModelVersions from '../components/admin/ModelVersions'
import NetworkTopology from '../components/admin/NetworkTopology'
import RecentDatasetsTable from '../components/admin/RecentDatasetsTable'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import Navbar from '../components/Navbar'
import { fetchAdminTeams, fetchAdminTelemetry } from '../services/adminApi'

const AdminDashboard = () => {
    // Live admin data. Initialised to null so each presentational sub-component
    // falls back to its original hardcoded placeholder until the API responds,
    // preserving the exact original look-and-feel before/without data.
    const [telemetry, setTelemetry] = useState(null)
    const [teams, setTeams] = useState(null)

    useEffect(() => {
        let isMounted = true

        const load = async () => {
            const [telemetryResult, teamsResult] = await Promise.all([
                fetchAdminTelemetry(),
                fetchAdminTeams(),
            ])

            if (!isMounted) return

            if (telemetryResult.data) setTelemetry(telemetryResult.data)
            if (teamsResult.data) setTeams(teamsResult.data)
        }

        load()

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <div className="flex min-h-screen flex-col bg-[#0b0e14] text-white">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar />
                <main className="flex-1 space-y-6 overflow-y-auto p-6">
                    <AdminHeader />
                    <AdminSystemMetrics telemetry={telemetry} />
                    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-5">
                            <ModelVersions />
                            <RecentDatasetsTable telemetry={telemetry} />
                        </div>
                        <NetworkTopology teams={teams} />
                    </div>
                </main>
            </div>
        </div>
    )
}


export default AdminDashboard
