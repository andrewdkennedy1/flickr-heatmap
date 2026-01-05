
const year = 2024; // Leap year
const currentYear = 2026;

const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
const days = [];

console.log('Testing logic for year:', year);

const cursor = new Date(start);
// Iterate while we are still in the requested year
while (cursor.getUTCFullYear() === year) {
    // Stop if we've reached the future (for current year)
    if (year === currentYear && cursor > new Date()) {
        break;
    }

    const dateStr = cursor.toISOString().split('T')[0];
    days.push(dateStr);

    // Move to next day
    cursor.setUTCDate(cursor.getUTCDate() + 1);
}

console.log('First day:', days[0]);
console.log('Last day:', days[days.length - 1]);
console.log('Total days:', days.length);
console.log('Has Dec 30:', days.includes('2024-12-30'));
console.log('Has Dec 31:', days.includes('2024-12-31'));

if (days.length === 366 && days.includes('2024-12-31')) {
    console.log('SUCCESS: Logic is correct.');
} else {
    console.log('FAILURE: Logic is incorrect.');
}
