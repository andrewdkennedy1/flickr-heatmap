import { NextResponse } from 'next/server';
import { getRequestToken, getAuthorizeUrl } from '@/lib/oauth';

export async function GET(): Promise<Response> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const callbackUrl = `${baseUrl}/api/auth/callback`;

        const { token, secret } = await getRequestToken(callbackUrl);

        const response = NextResponse.redirect(getAuthorizeUrl(token));

        // Store token secret in cookie for verification in callback
        response.cookies.set('oauth_token_secret', secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 3600, // 1 hour
            sameSite: 'lax',
        });

        return response;
    } catch (error: unknown) {
        console.error('OAuth login error:', error);
        const message = error instanceof Error ? error.message : 'Failed to initiate OAuth';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
