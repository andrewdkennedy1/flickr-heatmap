import { NextResponse } from 'next/server';
import { getOAuth, getAuthorizeUrl } from '@/lib/oauth';

export async function GET(): Promise<Response> {
    let oauth;
    try {
        oauth = getOAuth();
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Missing Flickr API credentials' }, { status: 500 });
    }

    return new Promise<NextResponse>((resolve) => {
        oauth.getOAuthRequestToken((error: any, oauthToken: string, oauthTokenSecret: string) => {
            if (error) {
                resolve(NextResponse.json({ error: 'Failed to obtain request token' }, { status: 500 }));
                return;
            }

            const response = NextResponse.redirect(getAuthorizeUrl(oauthToken));

            // Store token secret in cookie for verification
            response.cookies.set('oauth_token_secret', oauthTokenSecret, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 3600 // 1 hour
            });

            resolve(response);
        });
    });
}
