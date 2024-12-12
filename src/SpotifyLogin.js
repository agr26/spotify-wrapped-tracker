import React from 'react';

const SPOTIFY_CLIENT_ID = '2df8d93272614a9f898a56fb1c36f9f9';
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = [
  'user-top-read',
  'user-read-recently-played'
];

function SpotifyLogin() {
  const handleLogin = () => {
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'token',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES.join(' '),
      show_dialog: 'true'
    });

    window.location.href = `${authUrl}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#1DB954] mb-6">WrapTrack</h1>
        <button 
          onClick={handleLogin}
          className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold py-3 px-6 rounded-full transition-all"
        >
          Connect with Spotify
        </button>
      </div>
    </div>
  );
}

export default SpotifyLogin;