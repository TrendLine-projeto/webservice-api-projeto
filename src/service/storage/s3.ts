import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

type UploadInput = {
  buffer: Buffer;
  contentType?: string;
  originalName?: string;
  prefix?: string;
  cacheControl?: string;
};

type UploadResult = {
  key: string;
  url: string;
};

const requiredEnv = (name: string, fallbackName?: string) => {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) {
    const hint = fallbackName ? ` (ou ${fallbackName})` : '';
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}${hint}`);
  }
  return value;
};

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');
const DEFAULT_SIGNED_URL_TTL = 60 * 60;

const shouldUsePublicRead = () => {
  const raw = (process.env.S3_PUBLIC_READ || '').trim().toLowerCase();
  if (!raw) return true;
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'sim';
};

const getSafeExtension = (originalName?: string, contentType?: string) => {
  const extFromName = originalName ? path.extname(originalName) : '';
  if (extFromName) return extFromName;

  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };

  if (contentType && map[contentType]) {
    return map[contentType];
  }

  return '';
};

const getSafeBaseName = (originalName?: string, extension?: string) => {
  const base = originalName ? path.basename(originalName, extension || '') : 'arquivo';
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_').trim();
  return sanitized || 'arquivo';
};

const getS3Client = (() => {
  let client: S3Client | null = null;
  return () => {
    if (!client) {
      const endpoint = requiredEnv('S3_ENDPOINT', 'AWS_ENDPOINT_URL');
      const region = process.env.S3_REGION || process.env.AWS_DEFAULT_REGION || 'auto';
      const accessKeyId = requiredEnv('S3_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID');
      const secretAccessKey = requiredEnv('S3_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY');
      const forcePathStyle = (process.env.S3_FORCE_PATH_STYLE || 'true')
        .toLowerCase() !== 'false';

      client = new S3Client({
        region,
        endpoint,
        forcePathStyle,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
    return client;
  };
})();

const buildPublicUrl = (bucket: string, key: string) => {
  const publicBase = process.env.S3_PUBLIC_URL_BASE;
  if (publicBase) {
    return `${normalizeBaseUrl(publicBase)}/${key}`;
  }
  const endpoint = requiredEnv('S3_ENDPOINT', 'AWS_ENDPOINT_URL');
  return `${normalizeBaseUrl(endpoint)}/${bucket}/${key}`;
};

const getSignedUrlTtl = () => {
  const raw = process.env.S3_SIGNED_URL_EXPIRES_IN;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return DEFAULT_SIGNED_URL_TTL;
};

export const extractKeyFromUrl = (value: string) => {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/+/, '');
  }
  try {
    const url = new URL(value);
    let pathName = decodeURIComponent(url.pathname || '').replace(/^\/+/, '');
    const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
    if (bucket && pathName.startsWith(`${bucket}/`)) {
      pathName = pathName.slice(bucket.length + 1);
    }
    return pathName || null;
  } catch {
    return null;
  }
};

export const getSignedUrlForKey = async (key: string, expiresInSeconds?: number) => {
  const bucket = requiredEnv('S3_BUCKET', 'AWS_S3_BUCKET_NAME');
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const ttl = expiresInSeconds ?? getSignedUrlTtl();
  return await getSignedUrl(client, command, { expiresIn: ttl });
};

export const getSignedUrlFromUrl = async (url: string, expiresInSeconds?: number) => {
  const key = extractKeyFromUrl(url);
  if (!key) {
    return url;
  }
  return await getSignedUrlForKey(key, expiresInSeconds);
};

export const uploadBuffer = async ({
  buffer,
  contentType,
  originalName,
  prefix,
  cacheControl,
}: UploadInput): Promise<UploadResult> => {
  const bucket = requiredEnv('S3_BUCKET', 'AWS_S3_BUCKET_NAME');
  const extension = getSafeExtension(originalName, contentType);
  const baseName = getSafeBaseName(originalName, extension);
  const suffix = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const filename = `${baseName}-${suffix}${extension}`;
  const safePrefix = prefix ? prefix.replace(/^\/+|\/+$/g, '') : '';
  const key = safePrefix ? `${safePrefix}/${filename}` : filename;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
    CacheControl: cacheControl,
    ...(shouldUsePublicRead() ? { ACL: 'public-read' } : {}),
  });

  const client = getS3Client();
  await client.send(command);

  return {
    key,
    url: buildPublicUrl(bucket, key),
  };
};
