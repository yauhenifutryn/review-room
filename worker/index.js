import { handleApi } from './api.js';
import { HTML } from './ui.js';
export default {
  async fetch(request, env) {
    const candidateSource = async () => {
      const object = await env.BUCKET.get('dataset/v1/candidates.json');
      if (!object) return [];
      return typeof object.json === 'function' ? object.json() : JSON.parse(await object.text());
    };
    const apiResponse = await handleApi(request, env, candidateSource);
    if (apiResponse) return apiResponse;
    const path = new URL(request.url).pathname;
    if (path !== '/') return new Response('Not found', {status:404});
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    const nonce = crypto.randomUUID().replaceAll('-', '');
    const body = HTML.replaceAll('<script>', '<script nonce="'+nonce+'">');
    return new Response(request.method === 'HEAD' ? null : body, {headers:{
      'content-type':'text/html; charset=utf-8',
      'cache-control':'no-store',
      'content-security-policy':"default-src 'self'; script-src 'self' 'nonce-"+nonce+"'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com https://codex.openai.com",
      'x-content-type-options':'nosniff',
      'referrer-policy':'no-referrer',
      'permissions-policy':'camera=(), microphone=(), geolocation=()'
    }});
  }
};
