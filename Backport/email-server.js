// Local server to automatically append emails to CSV file
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const CSV_FILE = path.join(__dirname, 'subscribers.csv');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure CSV file exists with headers
function ensureCSVExists() {
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'Email,Timestamp,Date Added\n');
    console.log('Created subscribers.csv with headers');
  }
}

// Append email to CSV
app.post('/api/subscribe', (req, res) => {
  const { email, timestamp } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  // Check if email already exists
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
  const lines = csvContent.split('\n');
  const emailExists = lines.some(line => line.split(',')[0] === email);
  
  if (emailExists) {
    return res.json({ 
      success: true, 
      message: 'Email already subscribed',
      duplicate: true 
    });
  }
  
  // Append new email
  const dateAdded = new Date().toLocaleString();
  const newLine = `${email},${timestamp || new Date().toISOString()},"${dateAdded}"\n`;
  
  fs.appendFileSync(CSV_FILE, newLine);
  
  console.log(`✅ Added: ${email}`);
  
  res.json({ 
    success: true, 
    message: 'Email added successfully',
    totalSubscribers: lines.length
  });
});

// Get all subscribers
app.get('/api/subscribers', (req, res) => {
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  const subscribers = lines.slice(1).map(line => {
    const [email, timestamp, dateAdded] = line.split(',');
    return { email, timestamp, dateAdded: dateAdded?.replace(/"/g, '') };
  });
  
  res.json({
    total: subscribers.length,
    subscribers: subscribers
  });
});

// Get CSV file
app.get('/api/download', (req, res) => {
  res.download(CSV_FILE, 'subscribers.csv');
});

// Initialize
ensureCSVExists();

app.listen(PORT, () => {
  console.log(`
🚀 Email CSV Server Running!
📧 Server: http://localhost:${PORT}
📁 CSV File: ${CSV_FILE}

✅ Emails will be automatically appended to subscribers.csv
🔄 The file is automatically committed to Git (if you run the watcher)

API Endpoints:
- POST /api/subscribe - Add new email
- GET /api/subscribers - View all subscribers
- GET /api/download - Download CSV file
  `);
});