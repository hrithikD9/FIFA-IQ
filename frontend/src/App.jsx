import React from 'react'
import './index.css'
import { Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MatchOutcomePrediction from './pages/MatchOutcomePrediction'
import Login from './pages/Login'
import Signup from './pages/Signup'
import SignupStepTwo from './pages/SignupStepTwo'
import ForgotPassword from './pages/ForgotPassword'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import LegacyTimelinePage from './pages/LegacyTimelinePage'
import PersonalSettings from './pages/PersonalSettings'
import AdminRoute from './components/AdminRoute'
import { useAuth } from './context/useAuth'

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

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  return children
}


function App() {

  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route
        path='/predictions'
        element={(
          <ProtectedRoute>
            <MatchOutcomePrediction />
          </ProtectedRoute>
        )}
      />
      <Route path='/login' element={<Login/>}/>
      <Route path='/forgot-password' element={<ForgotPassword/>}/>
      <Route path='/history' element={<LegacyTimelinePage/>}/>
      <Route
        path='/dashboard'
        element={(
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path='/admin'
        element={(
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        )}
      />
      <Route
        path='/profile'
        element={(
          <ProtectedRoute>
            <PersonalSettings />
          </ProtectedRoute>
        )}
      />
      <Route path='/signup' element={<Signup/>}/>
      <Route
        path='/signup/step-2'
        element={hasCompletedSignupStepOne() ? <SignupStepTwo/> : <Navigate to='/signup' replace />}
      />
    </Routes>
  )
}

export default App
