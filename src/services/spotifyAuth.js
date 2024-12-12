import axios from 'axios';
import pkceChallenge from 'pkce-challenge';

const SPOTIFY_CLIENT_ID = '9b201755ec114123a092304a408e408e';
const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/callback';
const SPOTIFY_SCOPES = [
  'user-read-private', 
  'user-read-email', 
  'user-top-read', 
  'user-library-read'
].join(' ');

// Generate PKCE challenge for secure authentication
export const generateCodeVerifier = () => {
  const challenge = pkceChallenge();
  return {
    codeVerifier: challenge.code_verifier,
    codeChallenge: challenge.code_challenge
  };
};

// Redirect to Spotify Authorization
export const initiateSpotifyLogin = () => {
  const { codeVerifier, codeChallenge } = generateCodeVerifier();
  
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.set('scope', SPOTIFY_SCOPES);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('code_challenge', codeChallenge);

  window.location.href = authUrl.toString();
};

// Exchange Authorization Code for Access Token
export const exchangeCodeForToken = async (authorizationCode) => {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    localStorage.setItem('spotify_access_token', response.data.access_token);
    localStorage.setItem('spotify_refresh_token', response.data.refresh_token);

    return response.data;
  } catch (error) {
    console.error('Token exchange failed', error);
    throw error;
  }
};

// Check if user is logged in
export const isUserLoggedIn = () => {
  return !!localStorage.getItem('spotify_access_token');
};

// Logout
export const spotifyLogout = () => {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_code_verifier');
  window.location.href = '/login';
};

// Refresh Access Token
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('spotify_refresh_token');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    localStorage.setItem('spotify_access_token', response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error('Token refresh failed', error);
    initiateSpotifyLogin();
  }
};