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
  datetaken?: string;
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
        const data = await response.json() as any;

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
    const data = await response.json() as any;

    if (data.stat === 'fail') {
      throw new Error(data.message);
    }

    return data;
  }

  async findUserByUsername(username: string): Promise<string> {
    try {
      const data = await this.fetchFlickr('flickr.people.findByUsername', {
        username,
      }) as any;
      return data.user.nsid;
    } catch {
      // Fallback: try looking up as a URL slug
      return this.findUserByUrl(`https://www.flickr.com/photos/${username}/`);
    }
  }

  async findUserByUrl(url: string): Promise<string> {
    const data = await this.fetchFlickr('flickr.urls.lookupUser', { url }) as any;
    return data.user.id;
  }

  async getUserInfo(userId: string): Promise<any> {
    const data = await this.fetchFlickr('flickr.people.getInfo', { user_id: userId }) as any;
    return data.person;
  }

  async getEarliestPhotoDate(userId: string): Promise<string | null> {
    try {
      const person = await this.getUserInfo(userId);
      // firstdatetaken is in 'YYYY-MM-DD HH:MM:SS' format or empty
      if (person.photos?.firstdatetaken?._content) {
        return person.photos.firstdatetaken._content;
      }
      // Fallback to firstdate (upload date Unix timestamp)
      if (person.photos?.firstdate?._content) {
        const date = new Date(parseInt(person.photos.firstdate._content) * 1000);
        return date.toISOString();
      }
      return null;
    } catch (error) {
      console.error('[FlickrService] Failed to get user info:', error);
      return null;
    }
  }

  async getMonthlyCounts(
    userId: string,
    year: number,
    mode: 'taken' | 'upload' = 'taken'
  ): Promise<number[]> {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const counts = await Promise.all(
      months.map(async (monthIndex) => {
        const startOfMonth = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0) - 1000);

        const params: Record<string, string> = {
          user_id: userId,
          per_page: '1', // We only care about the 'total' field
          page: '1',
        };

        if (mode === 'taken') {
          params.min_taken_date = Math.floor(startOfMonth.getTime() / 1000).toString();
          params.max_taken_date = Math.floor(endOfMonth.getTime() / 1000).toString();
        } else {
          params.min_upload_date = Math.floor(startOfMonth.getTime() / 1000).toString();
          params.max_upload_date = Math.floor(endOfMonth.getTime() / 1000).toString();
        }

        try {
          const data = await this.fetchFlickr('flickr.photos.search', params) as any;
          return parseInt(data.photos?.total ?? '0', 10);
        } catch (error) {
          console.error(`[FlickrService] Failed to get counts for ${year}-${monthIndex + 1}:`, error);
          return 0;
        }
      })
    );
    return counts;
  }

  async getUserPhotos(
    userId: string,
    filters: {
      minUploadDate?: string;
      maxUploadDate?: string;
      minTakenDate?: string;
      maxTakenDate?: string;
    } = {}
  ): Promise<FlickrPhoto[]> {
    const allPhotos: FlickrPhoto[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const params: Record<string, string> = {
        user_id: userId,
        extras: 'date_upload,date_taken',
        per_page: '500',
        page: page.toString(),
      };

      if (filters.minUploadDate) {
        params.min_upload_date = filters.minUploadDate;
      }

      if (filters.maxUploadDate) {
        params.max_upload_date = filters.maxUploadDate;
      }

      if (filters.minTakenDate) {
        params.min_taken_date = filters.minTakenDate;
      }

      if (filters.maxTakenDate) {
        params.max_taken_date = filters.maxTakenDate;
      }

      const data = await this.fetchFlickr('flickr.people.getPhotos', params) as any;

      if (data.photos?.photo) {
        allPhotos.push(...data.photos.photo);
        totalPages = data.photos.pages;
      }

      page++;
    } while (page <= totalPages);

    return allPhotos;
  }

  async getUserPhotosPage(
    userId: string,
    page: number,
    perPage: number,
    filters: {
      minUploadDate?: string;
      maxUploadDate?: string;
      minTakenDate?: string;
      maxTakenDate?: string;
    } = {}
  ): Promise<{ photos: FlickrPhoto[]; totalPages: number }> {
    const params: Record<string, string> = {
      user_id: userId,
      extras: 'date_upload,date_taken',
      per_page: perPage.toString(),
      page: page.toString(),
    };

    if (filters.minUploadDate) {
      params.min_upload_date = filters.minUploadDate;
    }

    if (filters.maxUploadDate) {
      params.max_upload_date = filters.maxUploadDate;
    }

    if (filters.minTakenDate) {
      params.min_taken_date = filters.minTakenDate;
    }

    if (filters.maxTakenDate) {
      params.max_taken_date = filters.maxTakenDate;
    }

    const data = await this.fetchFlickr('flickr.people.getPhotos', params) as any;
    const photos = data.photos?.photo ?? [];
    const totalPages = data.photos?.pages ?? 1;

    return { photos, totalPages };
  }

  static aggregatePhotoData(
    photos: FlickrPhoto[],
    mode: 'upload' | 'taken' = 'upload'
  ): ActivityData[] {
    const counts: Record<string, number> = {};

    photos.forEach((photo) => {
      let dateStr = '';
      if (mode === 'taken') {
        if (photo.datetaken) {
          dateStr = photo.datetaken.split(' ')[0] ?? '';
        } else {
          const date = new Date(parseInt(photo.dateupload) * 1000);
          dateStr = date.toISOString().split('T')[0];
        }
      } else {
        const date = new Date(parseInt(photo.dateupload) * 1000);
        dateStr = date.toISOString().split('T')[0];
      }

      if (!dateStr) return;
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(counts), 0);

    return Object.entries(counts).map(([date, count]) => {
      const maxLevel = 7;
      let level = 0;

      if (count > 0) {
        if (maxCount === 1) {
          level = maxLevel; // Use max brightness for single photo if it's the only one
        } else {
          // Use logarithmic scale to handle wide range of values (1 to 300+)
          // This ensures low values (1-10) are distinguishable from high values
          const logCount = Math.log(count);
          const logMax = Math.log(maxCount);

          // Calculate ratio on log scale
          const ratio = logCount / logMax;

          // Map to 1-7 range
          level = Math.ceil(ratio * maxLevel);

          // Ensure at least level 1 if count > 0
          if (level < 1) level = 1;
        }
      }

      return { date, count, level };
    });
  }
}
