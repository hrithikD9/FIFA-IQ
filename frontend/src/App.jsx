import React from 'react'
import './index.css'
import { Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MatchOutcomePrediction from './pages/MatchOutcomePrediction'
import Login from './pages/Login'
import Signup from './pages/Signup'
import SignupStepTwo from './pages/SignupStepTwo'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import LegacyTimelinePage from './pages/LegacyTimelinePage'
import PersonalSettings from './pages/PersonalSettings'
import AdminGuard from './components/AdminGuard'
import UserGuard from './components/UserGuard'
import ProtectedRoute from './components/ProtectedRoute'

const SIGNUP_STEP_ONE_STORAGE_KEY = 'fifa-iq.signup.stepOne'

const hasCompletedSignupStepOne = () => {
  const storedStepOne = sessionStorage.getItem(SIGNUP_STEP_ONE_STORAGE_KEY)

  if (!storedStepOne) {
    return false
  }

  try {
    const stepOneData = JSON.parse(storedStepOne)
    return Boolean(stepOneData?.email)
  } catch {
    sessionStorage.removeItem(SIGNUP_STEP_ONE_STORAGE_KEY)
    return false
  }
}

function App() {

  return (
    <Routes>
      {/* Public routes */}
      <Route path='/' element={<Home/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/forgot-password' element={<ForgotPassword/>}/>
      <Route path='/reset-password' element={<ResetPassword/>}/>
      <Route path='/signup' element={<Signup/>}/>
      <Route
        path='/signup/step-2'
        element={hasCompletedSignupStepOne() ? <SignupStepTwo/> : <Navigate to='/signup' replace />}
      />

      {/* User-only workspace: locked to non-admin users. Admins are bounced to /admin. */}
      <Route
        path='/dashboard'
        element={
          <UserGuard>
            <UserDashboard />
          </UserGuard>
        }
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path='/predict' element={<MatchOutcomePrediction />}/>
        <Route path='/predictions' element={<MatchOutcomePrediction />}/>
        <Route path='/history' element={<LegacyTimelinePage />}/>
        <Route path='/profile' element={<PersonalSettings />}/>
      </Route>

      {/* Admin routes: locked to admins. Non-admin users are bounced to /dashboard. */}
            <Route
              path="admin"
              element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              }
            />
    </Routes>
  )
}

export default App
