/**
 * OAuth 1.0a implementation using Web Crypto API
 * Compatible with Cloudflare Workers (no Node.js dependencies)
 */

const FLICKR_REQUEST_TOKEN_URL = 'https://www.flickr.com/services/oauth/request_token';
const FLICKR_ACCESS_TOKEN_URL = 'https://www.flickr.com/services/oauth/access_token';
const FLICKR_AUTHORIZE_URL = 'https://www.flickr.com/services/oauth/authorize';

// Get API credentials from environment
function getCredentials() {
    const key = process.env.NEXT_PUBLIC_FLICKR_API_KEY;
    const secret = process.env.FLICKR_API_SECRET;

    if (!key || !secret) {
        throw new Error('Missing Flickr API Key or Secret');
    }

    return { key, secret };
}

// RFC 3986 percent-encoding
function percentEncode(str: string): string {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}

// Generate OAuth nonce
function generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
        nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
}

// Generate OAuth timestamp
function generateTimestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
}

// HMAC-SHA1 signature using Web Crypto API
async function hmacSha1(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    // Convert ArrayBuffer to base64
    const bytes = new Uint8Array(signature);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Build OAuth signature base string
function buildBaseString(
    method: string,
    url: string,
    params: Record<string, string>
): string {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
        .join('&');

    return `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
}

// Build OAuth Authorization header
function buildAuthHeader(params: Record<string, string>): string {
    const headerParams = Object.keys(params)
        .filter(key => key.startsWith('oauth_'))
        .sort()
        .map(key => `${percentEncode(key)}="${percentEncode(params[key])}"`)
        .join(', ');

    return `OAuth ${headerParams}`;
}

// Parse OAuth response (URL-encoded form)
function parseOAuthResponse(body: string): Record<string, string> {
    const result: Record<string, string> = {};
    body.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
            result[decodeURIComponent(key)] = decodeURIComponent(value);
        }
    });
    return result;
}

/**
 * Get OAuth Request Token (Step 1 of OAuth flow)
 */
export async function getRequestToken(callbackUrl: string): Promise<{
    token: string;
    secret: string;
}> {
    const { key, secret } = getCredentials();

    const oauthParams: Record<string, string> = {
        oauth_callback: callbackUrl,
        oauth_consumer_key: key,
        oauth_nonce: generateNonce(),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: generateTimestamp(),
        oauth_version: '1.0',
    };

    const baseString = buildBaseString('POST', FLICKR_REQUEST_TOKEN_URL, oauthParams);
    const signingKey = `${percentEncode(secret)}&`; // No token secret yet
    const signature = await hmacSha1(signingKey, baseString);

    oauthParams.oauth_signature = signature;

    const response = await fetch(FLICKR_REQUEST_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': buildAuthHeader(oauthParams),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to get request token: ${text}`);
    }

    const body = await response.text();
    const data = parseOAuthResponse(body);

    if (!data.oauth_token || !data.oauth_token_secret) {
        throw new Error('Invalid request token response');
    }

    return {
        token: data.oauth_token,
        secret: data.oauth_token_secret,
    };
}

/**
 * Get OAuth Access Token (Step 3 of OAuth flow, after user authorization)
 */
export async function getAccessToken(
    requestToken: string,
    requestSecret: string,
    verifier: string
): Promise<{
    token: string;
    secret: string;
    userId: string;
    username: string;
}> {
    const { key, secret } = getCredentials();

    const oauthParams: Record<string, string> = {
        oauth_consumer_key: key,
        oauth_nonce: generateNonce(),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: generateTimestamp(),
        oauth_token: requestToken,
        oauth_verifier: verifier,
        oauth_version: '1.0',
    };

    const baseString = buildBaseString('POST', FLICKR_ACCESS_TOKEN_URL, oauthParams);
    const signingKey = `${percentEncode(secret)}&${percentEncode(requestSecret)}`;
    const signature = await hmacSha1(signingKey, baseString);

    oauthParams.oauth_signature = signature;

    const response = await fetch(FLICKR_ACCESS_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': buildAuthHeader(oauthParams),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to get access token: ${text}`);
    }

    const body = await response.text();
    const data = parseOAuthResponse(body);

    if (!data.oauth_token || !data.oauth_token_secret) {
        throw new Error('Invalid access token response');
    }

    return {
        token: data.oauth_token,
        secret: data.oauth_token_secret,
        userId: data.user_nsid || '',
        username: data.username || '',
    };
}

/**
 * Make a signed OAuth request to Flickr API
 */
export async function signedFetch(
    url: string,
    accessToken: string,
    accessSecret: string
): Promise<Response> {
    const { key, secret } = getCredentials();

    // Parse URL to get base URL and existing params
    const urlObj = new URL(url);
    const existingParams: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
        existingParams[key] = value;
    });

    const oauthParams: Record<string, string> = {
        oauth_consumer_key: key,
        oauth_nonce: generateNonce(),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: generateTimestamp(),
        oauth_token: accessToken,
        oauth_version: '1.0',
    };

    // Combine OAuth params with URL params for signature
    const allParams = { ...existingParams, ...oauthParams };
    const baseUrl = `${urlObj.origin}${urlObj.pathname}`;

    const baseString = buildBaseString('GET', baseUrl, allParams);
    const signingKey = `${percentEncode(secret)}&${percentEncode(accessSecret)}`;
    const signature = await hmacSha1(signingKey, baseString);

    oauthParams.oauth_signature = signature;

    return fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': buildAuthHeader(oauthParams),
        },
    });
}

/**
 * Get the Flickr authorization URL (Step 2 - redirect user here)
 */
export function getAuthorizeUrl(requestToken: string): string {
    return `${FLICKR_AUTHORIZE_URL}?oauth_token=${requestToken}&perms=read`;
}
