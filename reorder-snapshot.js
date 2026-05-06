const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'snapshot_output.json');
const outputPath = path.join(__dirname, 'snapshot_fixed.json');

if (!fs.existsSync(inputPath)) {
  console.error('Input file not found. Run fetch-snapshot-json.js first.');
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Define the desired key order
const desiredOrder = [
  'meta',
  'regime',
  'dominant_narratives',
  'catalyst_calendar',
  'market_snapshot',
  'stories_to_track',
  'scenarios',
  'key_questions',
  'research_sources'
];

const orderedData = {};

// 1. Add keys in the desired order
desiredOrder.forEach(key => {
  if (rawData[key] !== undefined) {
    orderedData[key] = rawData[key];
  }
});

// 2. Add any remaining keys that weren't in the list
Object.keys(rawData).forEach(key => {
  if (!desiredOrder.includes(key)) {
    orderedData[key] = rawData[key];
  }
});

// 3. Reorder properties within specific sections if they feel "upside down"
// For example, in narratives, maybe id/type should be first
if (Array.isArray(orderedData.dominant_narratives)) {
  orderedData.dominant_narratives = orderedData.dominant_narratives.map(item => {
    const { id, type, tag, headline, summary, body, bullets, market_impact, sources, updates, ...rest } = item;
    return { id, type, tag, headline, summary, body, bullets, market_impact, sources, updates, ...rest };
  });
}

// Write the fixed JSON
fs.writeFileSync(outputPath, JSON.stringify(orderedData, null, 2));

console.log(`Fixed JSON written to: ${outputPath}`);
console.log('New key order:', Object.keys(orderedData));
