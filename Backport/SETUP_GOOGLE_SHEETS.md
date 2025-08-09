# Setting Up Google Sheets Integration for Subscribe Form

## Quick Setup (5 minutes)

### Step 1: Open Your Google Sheet
Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1x8pFCiYq9fy_RtnzI_dxwWCNWmwFI4qDyaRTmfbqpv4/edit

### Step 2: Set Up Headers
Make sure your sheet has these headers in the first row:
- A1: Email
- B1: Timestamp
- C1: Date Added

### Step 3: Create Google Apps Script
1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code
3. Copy and paste this code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Append row with email and timestamp
    sheet.appendRow([
      data.email,
      data.timestamp,
      new Date().toLocaleString()
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput('Slana Subscribe Endpoint Active')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

4. Click **Save** (name it "Slana Subscribe Handler")

### Step 4: Deploy as Web App
1. Click **Deploy > New Deployment**
2. Settings:
   - Type: **Web app**
   - Description: "Slana Subscribe Form"
   - Execute as: **Me**
   - Who has access: **Anyone**
3. Click **Deploy**
4. **COPY THE WEB APP URL** (it will look like: https://script.google.com/macros/s/...)

### Step 5: Update Your Website
1. Open `subscribe-form.js` in your code editor
2. Find this line:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
   ```
3. Replace with your actual URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR-ACTUAL-ID/exec';
   ```
4. Save the file
5. Commit and push to GitHub

## Testing

1. Visit your website
2. Enter a test email in the subscribe form
3. Click Subscribe
4. Check your Google Sheet - the email should appear!

## Troubleshooting

### If emails aren't appearing in the sheet:
1. Make sure the Web App is deployed with "Anyone" access
2. Check browser console for errors (F12)
3. Verify the URL is correctly copied

### Current Fallback
Until you set up the Google Apps Script, the form saves emails locally in the browser (localStorage) for testing.

## Alternative: Use Google Forms
If you prefer a simpler solution, you can:
1. Create a Google Form with just an email field
2. Embed it on your site
3. Responses automatically go to a Google Sheet

Let me know if you need help with either approach!