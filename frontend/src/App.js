import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Mill1Dashboard from './pages/Mill1Dashboard';
import Mill2Dashboard from './pages/Mill2Dashboard';
import MillDashboard from './pages/MillDashboard';
import EstateDashboard from './pages/EstateDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/mill1" element={<Mill1Dashboard />} />
        <Route path="/mill2" element={<Mill2Dashboard />} />
        <Route path="/mill" element={<MillDashboard />} />
        <Route path="/estate" element={<EstateDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
