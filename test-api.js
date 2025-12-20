const https = require('https');

const API_KEY = 'f592c5da090089573e25126378ad2c65';
const USERNAME = 'yoshislens';

function fetchFlickr(method, params) {
    return new Promise((resolve, reject) => {
        const searchParams = new URLSearchParams({
            method,
            api_key: API_KEY,
            format: 'json',
            nojsoncallback: '1',
            ...params,
        });

        const url = `https://www.flickr.com/services/rest/?${searchParams.toString()}`;
        console.log(`Fetching: ${url}`);

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function run() {
    try {
        // 1. Lookup User
        console.log('1. Looking up user...');
        let userId;
        try {
            const userRes = await fetchFlickr('flickr.people.findByUsername', { username: USERNAME });
            if (userRes.stat === 'fail') throw new Error(userRes.message);
            userId = userRes.user.nsid;
            console.log(`Found User ID: ${userId}`);
        } catch (e) {
            console.log('Username lookup failed, trying URL...');
            const urlRes = await fetchFlickr('flickr.urls.lookupUser', { url: `https://www.flickr.com/photos/${USERNAME}/` });
            if (urlRes.stat === 'fail') throw new Error(urlRes.message);
            userId = urlRes.user.id;
            console.log(`Found User ID (via URL): ${userId}`);
        }

        // 2. Get Public Photos (Unfiltered)
        console.log('\n2. Fetching recent public photos (Unfiltered)...');
        const photosRes = await fetchFlickr('flickr.people.getPhotos', {
            user_id: userId,
            per_page: 5,
            extras: 'date_upload,license,safety_level'
        });

        if (photosRes.stat === 'fail') {
            console.error('API Error:', photosRes.message);
        } else {
            console.log(`Total Photos: ${photosRes.photos.total}`);
            console.log(`Photos returned: ${photosRes.photos.photo.length}`);
            photosRes.photos.photo.forEach(p => {
                console.log(` - [${p.id}] ${p.title} (Safety: ${p.safety_level}, Uploaded: ${new Date(p.dateupload * 1000).toISOString()})`);
            });
        }

        // 3. Get Public Photos (Filtered 1 Year)
        console.log('\n3. Fetching recent public photos (Last 365 Days)...');
        const lastYear = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000);
        console.log('Using Min Date:', lastYear);
        const photosTimeRes = await fetchFlickr('flickr.people.getPhotos', {
            user_id: userId,
            per_page: 5,
            min_upload_date: lastYear,
            extras: 'date_upload'
        });

        if (photosTimeRes.stat === 'fail') {
            console.error('API Error:', photosTimeRes.message);
        } else {
            console.log(`Total Photos (Filtered): ${photosTimeRes.photos.total}`);
            if (photosTimeRes.photos.photo) {
                photosTimeRes.photos.photo.forEach(p => console.log(` - [${p.id}] ${new Date(p.dateupload * 1000).toISOString()}`));
            }
        }

    } catch (err) {
        console.error('Script Error:', err);
    }
}

run();
