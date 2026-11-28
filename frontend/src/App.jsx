import React from 'react'
import './index.css'
import { Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
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
import AppShell from './components/shell/AppShell'
import Fixtures from './pages/Fixtures'
import Results from './pages/Results'
import Scorecard from './pages/Scorecard'
import TeamDetails, { TeamsIndex } from './pages/TeamDetails'
import Players from './pages/Players'
import PlayerDetails from './pages/PlayerDetails'
import LiveScores from './pages/LiveScores'
import MatchPrediction from './pages/MatchPrediction'

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

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path='/history' element={<LegacyTimelinePage />}/>

        {/* Football data pages share the redesigned shell (sidebar + top bar). */}
        <Route element={<AppShell />}>
          {/* User workspace: non-admins only (admins are sent to /admin). */}
          <Route path='/dashboard' element={<UserGuard><UserDashboard /></UserGuard>}/>
          {/* Admin workspace: admins only (others are sent to /dashboard). */}
          <Route path='/admin' element={<AdminGuard><AdminDashboard /></AdminGuard>}/>
          <Route path='/profile' element={<PersonalSettings />}/>
          <Route path='/predict' element={<MatchPrediction />}/>
          <Route path='/predictions' element={<Navigate to='/predict' replace />}/>
          <Route path='/fixtures' element={<Fixtures />}/>
          <Route path='/live' element={<LiveScores />}/>
          <Route path='/results' element={<Results />}/>
          <Route path='/results/:matchId' element={<Scorecard />}/>
          <Route path='/teams' element={<TeamsIndex />}/>
          <Route path='/teams/:teamId' element={<TeamDetails />}/>
          <Route path='/players' element={<Players />}/>
          <Route path='/players/:playerId' element={<PlayerDetails />}/>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
