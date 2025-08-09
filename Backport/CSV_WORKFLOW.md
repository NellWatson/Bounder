# CSV Email Storage Workflow

## Overview
Instead of using Google Sheets, we now store subscriber emails in a CSV file directly in your GitHub repository. This is simpler, more reliable, and gives you full control.

## How It Works

1. **Website visitors** submit their email on your site
2. **Emails are stored** in browser localStorage 
3. **You periodically export** emails to `subscribers.csv`
4. **Commit to GitHub** to save permanently

## 📋 Quick Start

### To collect and save emails:

1. **Open the CSV Manager**
   ```
   open csv-email-manager.html
   ```

2. **Click "Download subscribers.csv"**
   - This downloads all collected emails as a CSV file

3. **Save to your repository**
   ```bash
   # Move downloaded file to repo (if needed)
   mv ~/Downloads/subscribers.csv .
   
   # Commit to GitHub
   git add subscribers.csv
   git commit -m "Update subscriber list"
   git push
   ```

## 🔧 Management Tools

### CSV Email Manager (`csv-email-manager.html`)
- View all collected emails
- See statistics (total, unique, today's signups)
- Export to CSV
- Import existing CSV files
- Merge and deduplicate emails

### Features:
- ✅ **No external dependencies** - works offline
- ✅ **Privacy focused** - data stays in your control
- ✅ **GitHub backup** - permanent storage in your repo
- ✅ **Easy export/import** - standard CSV format
- ✅ **Duplicate prevention** - same email won't be added twice

## 📊 CSV Format

The CSV file has three columns:
```
Email,Timestamp,Date Added
test@example.com,2025-01-27T10:30:00.000Z,"1/27/2025, 10:30:00 AM"
```

## 🚀 Advantages Over Google Sheets

1. **No API setup required** - works immediately
2. **No authentication issues** - no tokens or permissions
3. **Version controlled** - see history in Git
4. **Offline capable** - collect emails without internet
5. **Full ownership** - data in your repository

## 📝 Regular Workflow

### Daily/Weekly:
1. Open `csv-email-manager.html`
2. Click "Download subscribers.csv"
3. Commit to GitHub:
   ```bash
   git add subscribers.csv
   git commit -m "Update subscribers - $(date +%Y-%m-%d)"
   git push
   ```

### To Use Emails:
- Import `subscribers.csv` into any email service
- Open in Excel/Google Sheets for analysis
- Use with email marketing tools

## 🛠️ Troubleshooting

### Lost emails in localStorage?
- Check browser console: `localStorage.getItem('slana_subscribers')`
- Use CSV manager's import feature to restore from file

### Need to merge multiple sources?
1. Use "Import CSV" feature in manager
2. Click "Merge with Existing"
3. Download cleaned list

### Want to clear test emails?
- Use "Clear LocalStorage" in manager (careful!)
- Or manually edit `subscribers.csv` and commit

## 🎯 Best Practices

1. **Export regularly** - Don't let emails pile up in localStorage
2. **Commit often** - Push to GitHub after each export
3. **Keep backups** - Download CSV to your computer too
4. **Test first** - Use test@example.com to verify it works

This approach gives you a simple, reliable way to collect emails without any external dependencies!