import { NextRequest, NextResponse } from 'next/server';
import { getOAuth } from '@/lib/oauth';

export async function GET(request: NextRequest): Promise<Response> {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');
    const oauthTokenSecret = request.cookies.get('oauth_token_secret')?.value;

    if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
        return NextResponse.json({ error: 'Missing OAuth parameters' }, { status: 400 });
    }

    let oauth;
    try {
        oauth = getOAuth();
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Missing Flickr API credentials' }, { status: 500 });
    }

    return new Promise<NextResponse>((resolve) => {
        oauth.getOAuthAccessToken(
            oauthToken,
            oauthTokenSecret,
            oauthVerifier,
            (error: any, accessToken: string, accessTokenSecret: string, results: any) => {
                if (error) {
                    console.error('Error getting access token:', error);
                    resolve(NextResponse.json({ error: 'Failed to obtain access token' }, { status: 500 }));
                    return;
                }

                const response = NextResponse.redirect(new URL('/', request.url));

                // Store access token and basic user info
                response.cookies.set('flickr_access_token', accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    path: '/',
                    maxAge: 30 * 24 * 60 * 60 // 30 days
                });

                response.cookies.set('flickr_access_token_secret', accessTokenSecret, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    path: '/',
                    maxAge: 30 * 24 * 60 * 60
                });

                // 'results' usually contains user_nsid and username
                if (results) {
                    response.cookies.set('flickr_user_nsid', results.user_nsid as string, { httpOnly: false, path: '/' });
                    response.cookies.set('flickr_username', results.username as string, { httpOnly: false, path: '/' });
                }

                resolve(response);
            }
        );
    });
}
