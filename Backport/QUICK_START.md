# 🚀 Slana Website - Quick Start Guide

## Your Website is Live! 

🌐 **Visit your site**: https://nellinc.github.io/Slana/

## What's Working

✅ **Everything is functional**:
- Website fully migrated from Squarespace
- All 103 images downloaded and working
- Logo and favicon (happy brain) displaying
- Subscribe form collecting emails (locally for now)
- Completely free hosting on GitHub Pages

## Quick Tasks

### 1. Connect Subscribe Form to Google Sheets (10 min)

**Easy Setup Guide**: https://nellinc.github.io/Slana/google-sheets-setup.html

1. Open the guide above
2. Follow the step-by-step instructions
3. Your emails will save directly to your Google Sheet

**Your Sheet**: https://docs.google.com/spreadsheets/d/1x8pFCiYq9fy_RtnzI_dxwWCNWmwFI4qDyaRTmfbqpv4/

### 2. Use Custom Domain (Optional)

To use www.slana.org:
```bash
cd /Users/nellwatson/Documents/GitHub/Slana
echo "www.slana.org" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push
```

Then update your domain's DNS settings.

### 3. Make Content Changes

Edit the website:
```bash
cd /Users/nellwatson/Documents/GitHub/Slana
# Edit index.html with any text editor
git add -A
git commit -m "Update content"
git push
```

Changes appear in 5-10 minutes.

## File Locations

📁 **Your website files**: `/Users/nellwatson/Documents/GitHub/Slana`

Key files:
- `index.html` - Main website content
- `subscribe-form.js` - Email form handler
- `assets/images/` - All website images
- `DOCUMENTATION.md` - Full technical docs

## Need Help?

1. **Subscribe form setup**: See `google-sheets-setup.html`
2. **Alternative options**: See `subscribe-alternative.html`
3. **Full documentation**: See `DOCUMENTATION.md`
4. **Local testing**: Run `node server.js`

## Cost Savings

💰 **You're now saving**:
- Squarespace: ~$16-26/month
- Your cost: $0/month
- Annual savings: $192-312

Everything is set up and working! The only remaining task is connecting the subscribe form to your Google Sheet (takes 10 minutes).

---
🧠 Happy brain, happy savings!