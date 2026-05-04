const fs = require('fs');
const path = require('path');

async function testIngestion() {
  const filePath = path.join(__dirname, '../JSON Examples/market_intelligence_brief_05-03-26.json');
  console.log(`Reading JSON file from: ${filePath}`);

  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonPayload = JSON.parse(rawData);

  console.log(`Sending POST request to http://localhost:3000/api/ingest...`);

  try {
    const response = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonPayload)
    });

    const result = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', result);

    if (result.success) {
      console.log(`\nSuccess! The report was ingested. Check your Supabase database for report_id: ${result.report_id}`);
    }
  } catch (error) {
    console.error('Failed to run test:', error);
  }
}

testIngestion();
