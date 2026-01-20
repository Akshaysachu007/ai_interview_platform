import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import CandidatePage from './pages/CandidatePage'
import RecruiterPage from './pages/RecruiterPage'
import CandidateDashboard from './pages/CandidateDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import AdminDashboard from './pages/AdminDashboard'
import SubscriptionPage from './pages/SubscriptionPage'
import AIInterview from './pages/AIInterview'
import InterviewReport from './components/InterviewReport'

function App() {
  return (
    <div id="app-root">
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/candidate" element={<CandidatePage />} />
          <Route path="/recruiter" element={<RecruiterPage />} />
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/candidate/interview" element={<AIInterview />} />
          <Route path="/interview/:interviewId/report" element={<InterviewReport />} />
          <Route path="/recruiter/subscription" element={<SubscriptionPage />} />
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
