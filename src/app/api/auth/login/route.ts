import { NextResponse } from 'next/server';
import { oauth, getAuthorizeUrl } from '@/lib/oauth';

export async function GET() {
    return new Promise((resolve) => {
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
