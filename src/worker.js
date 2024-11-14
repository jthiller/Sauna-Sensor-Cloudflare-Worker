import { handleRequest } from './router';

addEventListener('fetch', event => {
    console.log('Fetch event received:', event.request.method, event.request.url);
    event.respondWith(handleRequest(event.request));
});
