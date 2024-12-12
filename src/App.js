import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SpotifyLogin from './SpotifyLogin';
import MainPage from './MainPage';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const hash = window.location.hash
      .substring(1)
      .split('&')
      .reduce((initial, item) => {
        let parts = item.split('=');
        initial[parts[0]] = decodeURIComponent(parts[1]);
        return initial;
      }, {});
  
    console.log("Hash:", hash); // Add this line
  
    if (hash.access_token) {
      console.log("Access token found:", hash.access_token); // Add this line
      setToken(hash.access_token);
      window.location.hash = '';
    } else {
      console.log("No access token found"); // Add this line
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<SpotifyLogin />} />
        <Route 
          path="/" 
          element={token ? <MainPage token={token} /> : <Navigate to="/login" />} 
        />
        <Route path="/callback" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;