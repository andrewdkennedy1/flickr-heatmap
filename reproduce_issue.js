
const year = 2024;
const currentYear = 2026;

const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
const end =
    year === currentYear
        ? new Date()
        : new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0) - 1);
const days = [];

console.log('Start:', start.toISOString());
console.log('End:', end.toISOString());

// Start loop
let cursor = new Date(start);
while (cursor.getTime() <= end.getTime()) {
    const dateStr = cursor.toISOString().split('T')[0];
    days.push(dateStr);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
}

console.log('First day:', days[0]);
console.log('Last day:', days[days.length - 1]);
console.log('Total days:', days.length); // Should be 366 for 2024
console.log('Dec 30 present?', days.includes('2024-12-30'));
console.log('Dec 31 present?', days.includes('2024-12-31'));

// Check for missing days
const expectedDays = 366;
if (days.length !== expectedDays) {
    console.log(`Mismatch! Expected ${expectedDays}, got ${days.length}`);
} else {
    console.log('All expected days are present.');
}
