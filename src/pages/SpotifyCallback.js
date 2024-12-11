import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../services/spotifyAuth';

function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          await exchangeCodeForToken(code);
          navigate('/dashboard'); // Redirect to dashboard after successful login
        } catch (error) {
          console.error('Authentication failed', error);
          navigate('/login');
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Processing Spotify login...</div>;
}

export default SpotifyCallback;