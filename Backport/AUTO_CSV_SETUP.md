# 🚀 Automatic Email to CSV Setup

## Overview
This system automatically appends subscriber emails to `subscribers.csv` without any manual steps.

## Quick Start (2 minutes)

### 1. First Time Setup
```bash
# Run the setup script
./setup-email-server.sh
```

### 2. Start the Auto-Save Server
```bash
# Start the email server
npm start

# OR start with auto-commit to Git (recommended)
npm run watch
```

### 3. That's it! 
Your website now automatically saves emails to `subscribers.csv`

## How It Works

1. **Visitor subscribes** on your website
2. **Email is sent** to local server (http://localhost:3001)
3. **Server appends** to subscribers.csv instantly
4. **Optional:** Auto-commits to Git (if using `npm run watch`)

## Features

✅ **Fully Automatic** - No manual export needed  
✅ **Instant Save** - Emails saved immediately to CSV  
✅ **Duplicate Prevention** - Won't add same email twice  
✅ **Fallback to localStorage** - Works even if server is off  
✅ **Auto Git Commits** - Optional automatic version control  

## Commands

### Basic Usage
```bash
# Start email server only
npm start

# Start with auto-commit watcher
npm run watch

# Development mode (auto-restart on changes)
npm run dev
```

### Check Your Emails
Open `subscribers.csv` or visit:
- http://localhost:3001/api/subscribers - View all subscribers
- http://localhost:3001/api/download - Download CSV

## File Structure
```
subscribers.csv          # Your email list (auto-updated)
email-server.js         # Local server that saves emails
csv-watcher.js          # Auto-commits to Git
package.json            # Dependencies
```

## Troubleshooting

### "Cannot connect to localhost:3001"
- Make sure the server is running: `npm start`
- Check if port 3001 is available

### Emails not saving
- Check server console for errors
- Verify subscribers.csv exists
- Try manually: `curl -X POST http://localhost:3001/api/subscribe -H "Content-Type: application/json" -d '{"email":"test@example.com"}'`

### Auto-commit not working
- Make sure you're using `npm run watch` (not just `npm start`)
- Check Git is initialized in the folder
- See commit errors in console

## Advanced Options

### Enable Auto-Push to GitHub
Edit `csv-watcher.js` and uncomment the auto-push section:
```javascript
// exec('git push', (pushError, pushStdout) => {
//   ...
// });
```

### Change Server Port
Edit `email-server.js`:
```javascript
const PORT = 3001; // Change this
```

### Custom CSV Location
Edit `email-server.js`:
```javascript
const CSV_FILE = path.join(__dirname, 'subscribers.csv');
```

## Security Notes

- Server only accepts connections from localhost
- No authentication needed (local only)
- Emails are validated before saving
- CSV file permissions are standard file system

## Workflow

### Daily Use
1. Start server when you turn on computer: `npm run watch`
2. Leave it running in background
3. Emails are automatically saved and committed
4. Push to GitHub whenever you want: `git push`

### Production Alternative
For production websites, consider:
- Using a proper database
- Cloud-based form services (Formspree, Netlify Forms)
- Server-side form handling

This local solution is perfect for:
- Small projects
- Local development
- Quick prototypes
- Full control over data

---

**Need help?** Check the server console for detailed logs!