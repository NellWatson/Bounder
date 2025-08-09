// Node.js script to save emails from localStorage to CSV file
const fs = require('fs');
const path = require('path');

// CSV file path
const CSV_FILE = path.join(__dirname, 'subscribers.csv');

// Function to append email to CSV
function saveEmailToCSV(email, timestamp) {
  // Check if file exists, if not create with headers
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'Email,Timestamp,Date Added\n');
  }
  
  // Append new row
  const row = `${email},${timestamp},${new Date(timestamp).toLocaleString()}\n`;
  fs.appendFileSync(CSV_FILE, row);
  
  console.log(`Added ${email} to subscribers.csv`);
}

// Function to read all subscribers
function readSubscribers() {
  if (!fs.existsSync(CSV_FILE)) {
    return [];
  }
  
  const content = fs.readFileSync(CSV_FILE, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      email: values[0],
      timestamp: values[1],
      dateAdded: values[2]
    };
  });
}

// Export functions for use in other scripts
module.exports = {
  saveEmailToCSV,
  readSubscribers
};

// Example usage (uncomment to test)
// saveEmailToCSV('test@example.com', new Date().toISOString());
// console.log(readSubscribers());