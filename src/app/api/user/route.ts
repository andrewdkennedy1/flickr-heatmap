import { NextRequest, NextResponse } from 'next/server';
import { FlickrService } from '@/lib/flickr';

export async function GET(request: NextRequest): Promise<Response> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const apiKey = process.env.NEXT_PUBLIC_FLICKR_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const accessToken = request.cookies.get('flickr_access_token')?.value;
        const accessTokenSecret = request.cookies.get('flickr_access_token_secret')?.value;

        const service = new FlickrService(apiKey, accessToken, accessTokenSecret);

        let userId: string;
        if (username.startsWith('http')) {
            userId = await service.findUserByUrl(username);
        } else {
            userId = await service.findUserByUsername(username);
        }

        const person = await service.getUserInfo(userId);
        const earliestDate = await service.getEarliestPhotoDate(userId);

        return NextResponse.json({
            success: true,
            userId,
            username: person.username._content,
            realname: person.realname?._content,
            earliestDate,
            avatar: `https://farm${person.iconfarm}.staticflickr.com/${person.iconserver}/buddyicons/${userId}.jpg`
        });
    } catch (error: unknown) {
        console.error('User API error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch user info';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
