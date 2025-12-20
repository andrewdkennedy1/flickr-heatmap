import { signedFetch } from './oauth';

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
    const searchParams = new URLSearchParams({
      method,
      api_key: this.apiKey,
      format: 'json',
      nojsoncallback: '1',
      ...params,
    });

    const url = `${FLICKR_API_URL}?${searchParams.toString()}`;

    // Use signed OAuth request if we have tokens
    if (this.accessToken && this.accessTokenSecret) {
      try {
        const response = await signedFetch(url, this.accessToken, this.accessTokenSecret);
        const data = await response.json();

        if (data.stat === 'fail') {
          throw new Error(data.message);
        }

        return data;
      } catch (error) {
        console.error('[FlickrService] OAuth request failed, falling back to unauthenticated:', error);
        // Fall through to unauthenticated request
      }
    }

    // Unauthenticated request
    const response = await fetch(url);
    const data = await response.json();

    if (data.stat === 'fail') {
      throw new Error(data.message);
    }

    return data;
  }

  async findUserByUsername(username: string): Promise<string> {
    try {
      const data = await this.fetchFlickr('flickr.people.findByUsername', {
        username,
      });
      return data.user.nsid;
    } catch {
      // Fallback: try looking up as a URL slug
      return this.findUserByUrl(`https://www.flickr.com/photos/${username}/`);
    }
  }

  async findUserByUrl(url: string): Promise<string> {
    const data = await this.fetchFlickr('flickr.urls.lookupUser', { url });
    return data.user.id;
  }

  async getUserPhotos(
    userId: string,
    minUploadDate?: string,
    maxUploadDate?: string
  ): Promise<FlickrPhoto[]> {
    const allPhotos: FlickrPhoto[] = [];
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

      if (maxUploadDate) {
        params.max_upload_date = maxUploadDate;
      }

      const data = await this.fetchFlickr('flickr.people.getPhotos', params);

      if (data.photos?.photo) {
        allPhotos.push(...data.photos.photo);
        totalPages = data.photos.pages;
      }

      page++;
    } while (page <= totalPages);

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

      return { date, count, level };
    });
  }
}
