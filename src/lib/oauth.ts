import { OAuth } from 'oauth';

const FLICKR_REQUEST_TOKEN_URL = 'https://www.flickr.com/services/oauth/request_token';
const FLICKR_ACCESS_TOKEN_URL = 'https://www.flickr.com/services/oauth/access_token';
const FLICKR_AUTHORIZE_URL = 'https://www.flickr.com/services/oauth/authorize';

const key = process.env.NEXT_PUBLIC_FLICKR_API_KEY;
const secret = process.env.FLICKR_API_SECRET;

if (!key || !secret) {
    throw new Error('Missing Flickr API Key or Secret');
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const oauth = new OAuth(
    FLICKR_REQUEST_TOKEN_URL,
    FLICKR_ACCESS_TOKEN_URL,
    key,
    secret,
    '1.0A',
    `${BASE_URL}/api/auth/callback`,
    'HMAC-SHA1'
);

export const getAuthorizeUrl = (requestToken: string) => {
    return `${FLICKR_AUTHORIZE_URL}?oauth_token=${requestToken}&perms=read`;
};
