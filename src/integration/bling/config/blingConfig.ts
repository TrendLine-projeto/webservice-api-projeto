import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const refreshFilePath = path.resolve(__dirname, './.refresh.json');
const clientId = process.env.BLINGCLIENTID!;
const clientSecret = process.env.BLING_API_SECRET!;

// === cache em memória do access token ===
let memAccessToken: string | null = null;
let memExpiresAt = 0; // epoch ms
let refreshing: Promise<void> | null = null;

function getRefreshTokenFromFile(): string | null {
  try {
    const data = fs.readFileSync(refreshFilePath, 'utf-8');
    const json = JSON.parse(data);
    return json.refresh_token || null;
  } catch {
    return null;
  }
}

function saveRefreshTokenToFile(token: string) {
  fs.writeFileSync(refreshFilePath, JSON.stringify({ refresh_token: token }, null, 2));
}

// força invalidar o token em cache (usado após 401)
export function invalidateAccessToken() {
  memAccessToken = null;
  memExpiresAt = 0;
}

/**
 * Pega um access_token válido. Só faz refresh se:
 * - não houver token em memória
 * - estiver perto de expirar
 * - for forçado (forceRefresh)
 */
export async function getAccessToken(opts?: { forceRefresh?: boolean }): Promise<string> {
  const forceRefresh = !!opts?.forceRefresh;
  const now = Date.now();

  if (!forceRefresh && memAccessToken && now < memExpiresAt - 30_000) {
    return memAccessToken; // ainda válido (30s de margem)
  }

  // serializa o refresh para não ter corrida
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = getRefreshTokenFromFile();
      if (!refreshToken) {
        throw new Error('Nenhum refresh_token encontrado (.refresh.json). Faça a autenticação inicial.');
      }

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const resp = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const data = (await resp.json()) as any;

      if (!resp.ok || !data.access_token) {
        // NÃO apague o arquivo aqui; deixe para reautenticar manualmente se necessário
        throw new Error(`Falha ao obter access_token via refresh_token: ${JSON.stringify(data)}`);
      }

      // guarda em memória
      memAccessToken = String(data.access_token);
      const expiresIn = Number(data.expires_in ?? 3600); // fallback 1h
      memExpiresAt = Date.now() + Math.max(60, expiresIn - 60) * 1000; // margem de 60s

      // alguns provedores ROTACIONAM o refresh_token
      if (data.refresh_token) {
        saveRefreshTokenToFile(String(data.refresh_token));
      }
    })();
  }

  try {
    await refreshing;
  } finally {
    refreshing = null;
  }

  if (!memAccessToken) {
    throw new Error('Não foi possível obter access_token.');
  }
  return memAccessToken;
}
