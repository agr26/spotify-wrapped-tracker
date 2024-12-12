import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../services/spotifyAuth';

function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Callback: Starting authentication process');
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        console.log('Callback: Authorization Code', code);

        if (code) {
          // Exchange the code for tokens
          await exchangeCodeForToken(code);
          console.log('Callback: Token exchange successful');
          
          // Explicitly navigate to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          console.error('Callback: No authorization code found');
          navigate('/login');
        }
      } catch (error) {
        console.error('Callback: Authentication failed', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Processing login... Please wait.</div>;
}

export default SpotifyCallback;