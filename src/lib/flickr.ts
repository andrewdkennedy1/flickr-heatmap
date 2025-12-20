export interface FlickrPhoto {
  id: string;
  owner: string;
  secret: string;
  server: string;
  farm: number;
  title: string;
  ispublic: number;
  isfriend: number;
  isfamily: number;
  dateupload: string;
}

export interface ActivityData {
  date: string;
  count: number;
  level: number;
}

const FLICKR_API_URL = 'https://www.flickr.com/services/rest/';

import { getOAuth } from './oauth';

export class FlickrService {
  private apiKey: string;
  private accessToken?: string;
  private accessTokenSecret?: string;

  constructor(apiKey: string, accessToken?: string, accessTokenSecret?: string) {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
    this.accessTokenSecret = accessTokenSecret;
  }

  private async fetchFlickr(method: string, params: Record<string, string>) {
    const url = `${FLICKR_API_URL}?method=${method}&format=json&nojsoncallback=1&api_key=${this.apiKey}&${new URLSearchParams(params).toString()}`;

    // If we have tokens, use the oauth lib to sign the request
    if (this.accessToken && this.accessTokenSecret) {
      let oauth;
      try {
        oauth = getOAuth();
      } catch (error: any) {
        throw new Error(error?.message || 'Missing Flickr API credentials');
      }

      return new Promise((resolve, reject) => {
        oauth.get(
          url,
          this.accessToken!,
          this.accessTokenSecret!,
          (err: any, data: any) => {
            if (err) {
              // The oauth lib returns detailed error objects
              console.error('OAuth request failed:', err);
              reject(new Error(`OAuth Error: ${err.statusCode} - ${err.data}`));
              return;
            }
            try {
              const parsed = JSON.parse(data as string);
              if (parsed.stat === 'fail') {
                reject(new Error(parsed.message));
              } else {
                resolve(parsed);
              }
            } catch (e) {
              reject(new Error('Failed to parse Flickr response'));
            }
          }
        );
      });
    }

    // Unauthenticated fallback
    const searchParams = new URLSearchParams({
      method,
      api_key: this.apiKey,
      format: 'json',
      nojsoncallback: '1',
      ...params,
    });

    const response = await fetch(`${FLICKR_API_URL}?${searchParams.toString()}`);
    const data = await response.json();

    if (data.stat === 'fail') {
      throw new Error(data.message);
    }

    return data;
  }

  async findUserByUsername(username: string): Promise<string> {
    console.log(`[FlickrService] Looking up user by username: ${username}`);
    try {
      const data = await this.fetchFlickr('flickr.people.findByUsername', {
        username,
      });
      console.log(`[FlickrService] Found user by username. NSID: ${data.user.nsid}`);
      return data.user.nsid;
    } catch (err) {
      console.warn(`[FlickrService] findByUsername failed for ${username}. Trying URL lookup fallback.`);
      // Fallback: try looking up as a URL slug if findByUsername fails
      return this.findUserByUrl(`https://www.flickr.com/photos/${username}/`);
    }
  }

  async findUserByUrl(url: string): Promise<string> {
    console.log(`[FlickrService] Looking up user by URL: ${url}`);
    const data = await this.fetchFlickr('flickr.urls.lookupUser', {
      url,
    });
    console.log(`[FlickrService] Found user by URL. ID: ${data.user.id}`);
    return data.user.id; // lookupUser returns data.user.id for NSID
  }

  async getUserPhotos(userId: string, minUploadDate?: string): Promise<FlickrPhoto[]> {
    console.log(`[FlickrService] Fetching photos for updated userId: ${userId}, minDate: ${minUploadDate}`);
    let allPhotos: FlickrPhoto[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const params: Record<string, string> = {
        user_id: userId,
        extras: 'date_upload',
        per_page: '500',
        page: page.toString(),
      };

      if (minUploadDate) {
        params.min_upload_date = minUploadDate;
      }

      console.log(`[FlickrService] Fetching page ${page}...`);
      const data = await this.fetchFlickr('flickr.people.getPhotos', params);

      if (data.photos && data.photos.photo) {
        allPhotos = allPhotos.concat(data.photos.photo);
        totalPages = data.photos.pages;
        console.log(`[FlickrService] Page ${page}: Fetched ${data.photos.photo.length} photos. Total so far: ${allPhotos.length}. Total pages: ${totalPages}`);
      } else {
        console.warn('[FlickrService] No photos found in response', data);
      }

      page++;
    } while (page <= totalPages && page <= 10); // Limit to 10 pages for safety

    console.log(`[FlickrService] Total photos fetched: ${allPhotos.length}`);

    // DEBUG: If no photos found with filter, try fetching without filter to see what's wrong
    if (allPhotos.length === 0 && minUploadDate) {
      console.warn('[FlickrService] 0 photos found with filter. Attempting to fetch latest 5 photos WITHOUT filter to debug...');
      const debugParams: Record<string, string> = {
        user_id: userId,
        extras: 'date_upload',
        per_page: '5',
        page: '1',
      };
      const debugData = await this.fetchFlickr('flickr.people.getPhotos', debugParams);
      if (debugData.photos && debugData.photos.photo) {
        console.log('[FlickrService] Latest 5 photos (unfiltered):');
        debugData.photos.photo.forEach((p: any) => {
          const d = new Date(parseInt(p.dateupload) * 1000);
          console.log(` - ID: ${p.id}, Title: "${p.title}", Uploaded: ${p.dateupload} (${d.toISOString()})`);
        });
      }
    }

    if (allPhotos.length > 0) {
      console.log(`[FlickrService] Sample photo dates:`, allPhotos.slice(0, 3).map(p => ({ title: p.title, dateupload: p.dateupload })));
    }
    return allPhotos;
  }

  static aggregatePhotoData(photos: FlickrPhoto[]): ActivityData[] {
    const counts: Record<string, number> = {};

    photos.forEach((photo) => {
      const date = new Date(parseInt(photo.dateupload) * 1000);
      const dateStr = date.toISOString().split('T')[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(counts), 0);

    return Object.entries(counts).map(([date, count]) => {
      // Calculate level based on GitHub's 4-level system
      let level = 0;
      if (count > 0) {
        if (maxCount === 1) level = 2;
        else {
          const ratio = count / maxCount;
          if (ratio <= 0.25) level = 1;
          else if (ratio <= 0.5) level = 2;
          else if (ratio <= 0.75) level = 3;
          else level = 4;
        }
      }

      return {
        date,
        count,
        level,
      };
    });
  }
}
