import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SpotifyStatsDashboard from './components/SpotifyStatsDashboard';
import SpotifyCallback from './pages/SpotifyCallback';
import LoginPage from './pages/LoginPage';
import { isUserLoggedIn } from './services/spotifyAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/dashboard" 
          element={
            isUserLoggedIn() ? <SpotifyStatsDashboard /> : <Navigate to="/login" />
          } 
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<SpotifyCallback />} />
        <Route 
          path="/" 
          element={
            isUserLoggedIn() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;