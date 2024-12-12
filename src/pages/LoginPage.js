import React from 'react';
import { auth, spotifyProvider, signInWithPopup } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleSpotifyLogin = async () => {
    try {
      const result = await signInWithPopup(auth, spotifyProvider);
      console.log('Spotify Login Result:', result);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#1DB954] mb-6">
          WrapTrack
        </h1>
        <button 
          onClick={handleSpotifyLogin}
          className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold py-3 px-6 rounded-full transition-all"
        >
          Connect with Spotify
        </button>
      </div>
    </div>
  );
}

export default LoginPage;