# Fix Google Sheets Integration for Slana Subscribe Form

## The Problem
The form shows "Unknown error" because the Google Apps Script needs to be properly set up with your specific Google Sheet.

## Step-by-Step Fix

### 1. Open Your Google Sheet
- Go to: https://docs.google.com/spreadsheets/d/1kx1_ilWoBq0rBhbIgLZ-Hmxrc_-wHs8mnt1wX0KttSU/edit
- This is YOUR sheet where emails will be collected

### 2. Set Up Column Headers
In your sheet, make sure Row 1 has these headers:
- Column A: `Email`
- Column B: `Timestamp (ISO)`
- Column C: `Timestamp (Local)`

### 3. Open Apps Script
- In your Google Sheet, click `Extensions` → `Apps Script`
- Delete any existing code in the editor

### 4. Copy the Fixed Script
Copy ALL the code from `google-apps-script-fixed.js` and paste it into the Apps Script editor.

### 5. Save the Script
- Click the save icon or press `Ctrl+S` (or `Cmd+S` on Mac)
- Name it something like "Slana Subscribe Handler"

### 6. Deploy as Web App
1. Click `Deploy` → `New Deployment`
2. Click the gear icon and select `Web app`
3. Fill in:
   - Description: "Slana Subscribe Form Handler"
   - Execute as: **Me** (your email)
   - Who has access: **Anyone**
4. Click `Deploy`

### 7. Copy the Web App URL
- You'll get a URL that looks like:
  `https://script.google.com/macros/s/AKfycb.../exec`
- Copy this ENTIRE URL

### 8. Update Your Website
The URL is already in your `subscribe-form.js` file. If you need to change it:
- Open `subscribe-form.js`
- Find line 15: `const GOOGLE_SCRIPT_URL = '...'`
- Replace the URL with your new one

### 9. Test the Form
1. Open your website
2. Enter a test email like `test@example.com`
3. Click Subscribe
4. Check your Google Sheet - the email should appear!

## Troubleshooting

### If emails aren't appearing in the sheet:

1. **Check Script Permissions**
   - Go back to Apps Script
   - Click `Run` → `testSheetAccess`
   - It will ask for permissions - approve them
   - This ensures the script can write to your sheet

2. **Verify the Deployment**
   - In Apps Script, click `Deploy` → `Manage deployments`
   - Make sure there's an active deployment
   - The URL should match what's in your code

3. **Check for CORS Issues**
   - The form uses `no-cors` mode, so you won't see response details
   - Emails are also saved to browser localStorage as backup
   - Check browser console for any errors

### To View Backup Emails (if Sheet fails):
Open browser console and run:
```javascript
console.log(JSON.parse(localStorage.getItem('slana_subscribers')));
```

## Important Notes

1. **The form will ALWAYS show success** because we use `no-cors` mode
2. **Emails are saved to localStorage** as a backup
3. **The Google Script must be deployed as "Anyone"** for it to work
4. **You need to authorize the script** when you first run it

## Current Script URL
Your current script URL in the code is:
```
https://script.google.com/macros/s/AKfycbyjOi3mnvynWtnd3J9klcAdFPoVwviSUFchFdyId7K5DbdIxt1KUWzL9M1Zc2v0ospfWQ/exec
```

If this is YOUR deployment URL and you've followed the steps above, it should work!