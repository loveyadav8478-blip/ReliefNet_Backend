/*
 * Runtime configuration — edit this file on the server after `npm run build`.
 * No rebuild needed: the app reads it before the bundle starts.
 *
 *   apiUrl: public base URL of the ReliefNet backend
 *           e.g. 'https://reliefnet-api.onrender.com'
 *
 * Leave apiUrl empty to fall back to the build-time VITE_API_URL, and then to
 * http://localhost:8081 for local development.
 */
window.__RELIEFNET_CONFIG__ = {
  apiUrl: '',
};
