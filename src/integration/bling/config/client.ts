import { getAccessToken, invalidateAccessToken } from './blingConfig';

async function blingFetch(url: string, init: RequestInit = {}, retry = true): Promise<Response> {
  let token = await getAccessToken(); // NÃO faz refresh toda hora, usa cache em memória

  const doFetch = (t: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${t}`,
      },
    });

  let resp = await doFetch(token);

  // Se o access token expirou, tenta renovar 1x e repetir
  if (resp.status === 401 && retry) {
    invalidateAccessToken();                  // invalida cache
    token = await getAccessToken({ forceRefresh: true }); // faz refresh de verdade
    resp = await doFetch(token);
  }

  return resp;
}

export const blingClient = {
  get: (path: string) => blingFetch(`https://www.bling.com.br/Api/v3${path}`),
  post: (path: string, body: any) =>
    blingFetch(`https://www.bling.com.br/Api/v3${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
};