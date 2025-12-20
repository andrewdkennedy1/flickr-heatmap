import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/oauth';

export async function GET(request: NextRequest): Promise<Response> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const oauthToken = searchParams.get('oauth_token');
        const oauthVerifier = searchParams.get('oauth_verifier');
        const oauthTokenSecret = request.cookies.get('oauth_token_secret')?.value;

        if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
            return NextResponse.json({ error: 'Missing OAuth parameters' }, { status: 400 });
        }

        const { token, secret, userId, username } = await getAccessToken(
            oauthToken,
            oauthTokenSecret,
            oauthVerifier
        );

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = NextResponse.redirect(new URL('/', baseUrl));

        // Store access token and secret
        response.cookies.set('flickr_access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            sameSite: 'lax',
        });

        response.cookies.set('flickr_access_token_secret', secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
            sameSite: 'lax',
        });

        // Store user info (readable by client)
        if (userId) {
            response.cookies.set('flickr_user_nsid', userId, {
                httpOnly: false,
                path: '/',
                maxAge: 30 * 24 * 60 * 60,
                sameSite: 'lax',
            });
        }

        if (username) {
            response.cookies.set('flickr_username', username, {
                httpOnly: false,
                path: '/',
                maxAge: 30 * 24 * 60 * 60,
                sameSite: 'lax',
            });
        }

        // Clear the temporary request token secret
        response.cookies.delete('oauth_token_secret');

        return response;
    } catch (error: unknown) {
        console.error('OAuth callback error:', error);
        const message = error instanceof Error ? error.message : 'Failed to complete OAuth';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
