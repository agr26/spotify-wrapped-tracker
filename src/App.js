import React, { useState, useEffect } from 'react';
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

    if (hash.access_token) {
      setToken(hash.access_token);
      window.location.hash = '';
    }
  }, []);

  return (
    <div className="App">
      {!token ? (
        <SpotifyLogin />
      ) : (
        <MainPage token={token} />
      )}
    </div>
  );
}

export default App;