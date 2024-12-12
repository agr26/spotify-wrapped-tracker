import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebaseConfig';

import SpotifyStatsDashboard from './components/SpotifyStatsDashboard';
import SpotifyCallback from './pages/SpotifyCallback';
import LoginPage from './pages/LoginPage';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/dashboard" 
          element={user ? <SpotifyStatsDashboard /> : <Navigate to="/login" />} 
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<SpotifyCallback />} />
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;