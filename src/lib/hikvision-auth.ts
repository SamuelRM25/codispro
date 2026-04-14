import crypto from 'crypto';

/**
 * Parses the WWW-Authenticate header to extract Digest parameters.
 */
function parseDigestHeader(header: string) {
  const params: Record<string, string> = {};
  const match = header.match(/Digest (.*)/);
  if (!match) return params;

  match[1].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).forEach(part => {
    const [key, value] = part.split('=');
    params[key.trim()] = value.trim().replace(/"/g, '');
  });
  return params;
}

/**
 * Calculates the Digest response for Hikvision ISAPI.
 */
function calculateDigest(
  method: string,
  url: string,
  params: Record<string, string>,
  username: string,
  password: string,
  nc: string,
  cnonce: string
) {
  const md5 = (str: string) => crypto.createHash('md5').update(str).digest('hex');

  const ha1 = md5(`${username}:${params.realm}:${password}`);
  const ha2 = md5(`${method.toUpperCase()}:${url}`);
  
  let response;
  if (params.qop === 'auth') {
    response = md5(`${ha1}:${params.nonce}:${nc}:${cnonce}:auth:${ha2}`);
  } else {
    response = md5(`${ha1}:${params.nonce}:${ha2}`);
  }

  return response;
}

/**
 * Custom fetch wrapper for Hikvision ISAPI that handles Digest Authentication.
 */
export async function hikvisionFetch(url: string, options: any = {}, credentials: { username: string, password: string }) {
  const method = options.method || 'GET';
  
  // 1. First request to trigger the 401 challenge
  let response = await fetch(url, { ...options });

  if (response.status === 401) {
    const wwwAuth = response.headers.get('www-authenticate');
    if (wwwAuth && wwwAuth.startsWith('Digest')) {
      const params = parseDigestHeader(wwwAuth);
      const nc = '00000001'; // Number of requests
      const cnonce = crypto.randomBytes(8).toString('hex');
      
      // We need the relative path for the Digest calculation
      const parsedUrl = new URL(url);
      const relativePath = parsedUrl.pathname + parsedUrl.search;

      const authResponse = calculateDigest(
        method,
        relativePath,
        params,
        credentials.username,
        credentials.password,
        nc,
        cnonce
      );

      let authHeader = `Digest username="${credentials.username}", realm="${params.realm}", nonce="${params.nonce}", uri="${relativePath}", response="${authResponse}"`;
      if (params.qop === 'auth') {
        authHeader += `, qop=auth, nc=${nc}, cnonce="${cnonce}"`;
      }
      if (params.opaque) {
        authHeader += `, opaque="${params.opaque}"`;
      }

      // 2. Second request with Authorization header
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': authHeader,
        },
      });
    }
  }

  return response;
}
