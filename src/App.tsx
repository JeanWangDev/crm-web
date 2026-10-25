import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { AppLayout } from './layout/AppLayout'
import { AccountsPage } from './pages/AccountsPage'
import { CheckinPage } from './pages/CheckinPage'
import { DashboardPage } from './pages/DashboardPage'
import { BedAssignPage } from './pages/BedAssignPage'
import { DormBedsPage, DormBuildingsPage, DormFloorsPage, DormRoomsPage, DormsPage } from './pages/DormsPage'
import { LeadsPage } from './pages/LeadsPage'
import { LoginPage } from './pages/LoginPage'
import { PickupPage } from './pages/PickupPage'
import { StudentsPage } from './pages/StudentsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="checkins" element={<CheckinPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="pickup" element={<PickupPage />} />
            <Route path="housing/assign" element={<BedAssignPage />} />
            <Route path="housing/places" element={<DormsPage />} />
            <Route path="housing/buildings" element={<DormBuildingsPage />} />
            <Route path="housing/floors" element={<DormFloorsPage />} />
            <Route path="housing/rooms" element={<DormRoomsPage />} />
            <Route path="housing/beds" element={<DormBedsPage />} />
            <Route path="system/accounts" element={<AccountsPage />} />
            <Route path="dorms" element={<Navigate to="/housing/assign" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
