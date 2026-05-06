import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const reverbHost = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || (window.location.protocol === 'https:' ? 'https' : 'http');
const isHttps = reverbScheme === 'https';

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'km4rfpdcyrkvvchuj6b9',
    wsHost: reverbHost,
    wsPort: isHttps ? 443 : (parseInt(import.meta.env.VITE_REVERB_PORT) || 80),
    wssPort: isHttps ? 443 : (parseInt(import.meta.env.VITE_REVERB_PORT) || 443),
    forceTLS: isHttps,
    enabledTransports: ['ws', 'wss'],
});

