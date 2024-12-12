import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../services/spotifyAuth';

function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('CALLBACK COMPONENT MOUNTED');
      
      try {
        // Log the full URL
        console.log('Full URL:', window.location.href);

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        console.log('Authorization Code:', code);

        if (code) {
          try {
            console.log('Attempting to exchange code for token');
            
            // Actually exchange the code
            const tokenResponse = await exchangeCodeForToken(code);
            
            console.log('Token Exchange Successful:', tokenResponse);
            console.log('Access Token:', localStorage.getItem('spotify_access_token'));

            // Multiple navigation attempts
            window.location.href = '/dashboard';
            navigate('/dashboard', { replace: true });
          } catch (exchangeError) {
            console.error('TOKEN EXCHANGE FAILED', exchangeError);
            navigate('/login');
          }
        } else {
          console.error('NO AUTHORIZATION CODE FOUND');
          navigate('/login');
        }
      } catch (error) {
        console.error('AUTHENTICATION PROCESS FAILED', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Processing login... Please wait.</div>;
}

export default SpotifyCallback;