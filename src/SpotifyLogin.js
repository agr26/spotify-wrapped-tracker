import React from 'react';

const SPOTIFY_CLIENT_ID = '2df8d93272614a9f898a56fb1c36f9f9';
const REDIRECT_URI = 'http://localhost:3000';
const SCOPES = ['user-top-read', 'user-read-recently-played'];

function SpotifyLogin() {
  const handleLogin = () => {
    window.location = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES.join('%20')}&response_type=token&show_dialog=true`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="bg-gradient-to-r from-[#1DB954] to-[#179443] rounded-xl shadow-lg mb-6 p-8">
          <h1 className="text-3xl font-bold mb-2">WrapTrack</h1>
          <p className="text-lg opacity-90">
            Your Spotify Wrapped Progress Tracker
          </p>
        </div>
        <button 
          onClick={handleLogin}
          className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold py-3 px-6 rounded-full transition-all duration-300"
        >
          Connect with Spotify
        </button>
      </div>
    </div>
  );
}

export default SpotifyLogin;