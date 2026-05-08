const fs = require('fs');
const path = require('path');

async function testUpdate() {
  const filePath = path.join(__dirname, '../JSON Examples/update_payload_05-06-26.json');
  console.log(`Reading JSON patch file from: ${filePath}`);

  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonPayload = JSON.parse(rawData);

  console.log(`Sending POST request to http://localhost:3000/api/update...`);

  try {
    const response = await fetch('http://localhost:3000/api/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonPayload)
    });

    let result;
    const responseText = await response.text();
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Server returned non-JSON response:', responseText);
      return;
    }

    console.log('Response Status:', response.status);
    console.log('Response Body:', result);

    if (result.success) {
      console.log(`\nSuccess! The report was updated to version ${result.version}.`);
    } else {
      console.error(`\nFailed to update report:`, result.error);
    }
  } catch (error) {
    console.error('Failed to run test:', error);
  }
}

testUpdate();
