import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import DemoCodeLog from './components/DemoCodeLog'
import { Spinner } from '@/components/ui/Spinner'

const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const GardenPage = lazy(() => import('./pages/GardenPage'))
const CheckinPage = lazy(() => import('./pages/CheckinPage'))
const BadgePage = lazy(() => import('./pages/BadgePage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const StoolPage = lazy(() => import('./pages/StoolPage'))
const ClassroomPage = lazy(() => import('./pages/ClassroomPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DemoCodeLog />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<Layout />}>
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/garden" element={<GardenPage />} />
                <Route path="/checkin" element={<CheckinPage />} />
                <Route path="/stool" element={<StoolPage />} />
                <Route path="/classroom" element={<ClassroomPage />} />
                <Route path="/badges" element={<BadgePage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
