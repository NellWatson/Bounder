# URGENT: Fix Google Sheets Integration

## The Problem
The Google Script URL in your code (`AKfycbyjOi3m...`) is NOT connected to YOUR Google Sheet. You need to create your OWN deployment.

## Step-by-Step Solution

### Step 1: Open YOUR Google Sheet
Open this exact link: https://docs.google.com/spreadsheets/d/1kx1_ilWoBq0rBhbIgLZ-Hmxrc_-wHs8mnt1wX0KttSU/edit

### Step 2: Add Headers (if not already there)
In Row 1, add these headers:
- Cell A1: `Email`
- Cell B1: `Timestamp (ISO)`
- Cell C1: `Timestamp (Local)`

### Step 3: Open Apps Script
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. A new tab will open with the script editor

### Step 4: Delete Everything and Add New Code
1. Delete ALL existing code in the editor
2. Copy and paste this EXACT code:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get current timestamp
    const timestamp = new Date();
    
    // Append row with email and timestamps
    sheet.appendRow([
      data.email,
      data.timestamp || timestamp.toISOString(),
      timestamp.toLocaleString()
    ]);
    
    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({'result': 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error
    return ContentService
      .createTextOutput(JSON.stringify({'result': 'error', 'error': error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Slana Subscribe Form Handler Active')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Run this once to set up headers
function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.getRange(1, 1).setValue('Email');
  sheet.getRange(1, 2).setValue('Timestamp (ISO)');
  sheet.getRange(1, 3).setValue('Timestamp (Local)');
}
```

### Step 5: Save and Name Your Project
1. Press **Ctrl+S** (or **Cmd+S** on Mac)
2. Name it: "Slana Email Collector"

### Step 6: Run Setup Function (ONE TIME)
1. In the dropdown menu at the top, select `setupSheet`
2. Click the **Run** button (▶️)
3. It will ask for permissions - click **Review Permissions**
4. Choose your Google account
5. Click **Advanced** → **Go to Slana Email Collector (unsafe)**
6. Click **Allow**

### Step 7: Deploy as Web App
1. Click **Deploy** → **New Deployment**
2. Click the gear icon ⚙️ → Select **Web app**
3. Fill in these EXACT settings:
   - **Description**: Slana Subscribe Form
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**

### Step 8: Copy YOUR Web App URL
1. You'll see a URL like: `https://script.google.com/macros/s/AKfycb.../exec`
2. **COPY THIS ENTIRE URL**
3. Click **Done**

### Step 9: Update Your Website Code
1. Open `/Users/nellwatson/Documents/GitHub/Slana/subscribe-form.js`
2. Find line 15: `const GOOGLE_SCRIPT_URL = '...'`
3. Replace the ENTIRE URL with YOUR new URL
4. Save the file

### Step 10: Test Your Form
1. Go to your website
2. Enter email: `test@example.com`
3. Click Subscribe
4. Check your Google Sheet - the email should appear!

## If It's Still Not Working:

### Check Deployment Status
1. In Apps Script, click **Deploy** → **Manage deployments**
2. Make sure you see an ACTIVE deployment
3. The URL should match what you put in your code

### Test the Script Directly
1. Copy your deployment URL
2. Paste it in a new browser tab
3. You should see: "Slana Subscribe Form Handler Active"

### Common Issues:
- **Wrong URL**: Make sure you copied the ENTIRE URL including `/exec` at the end
- **Not deployed**: Make sure deployment shows as "Active"
- **Permissions**: Make sure "Who has access" is set to "Anyone"

## Emergency Backup
If you can't get Google Sheets working, all emails are being saved to browser localStorage. To extract them:

1. Open your website
2. Open browser console (F12)
3. Run: `console.table(JSON.parse(localStorage.getItem('slana_subscribers')))`
4. Copy the data manually

## YOUR ACTION ITEMS:
1. ✅ Open YOUR Google Sheet
2. ✅ Go to Extensions → Apps Script
3. ✅ Copy the code above
4. ✅ Deploy as Web App
5. ✅ Get YOUR URL
6. ✅ Update subscribe-form.js with YOUR URL
7. ✅ Test the form

The current URL in your code is NOT yours - you MUST create your own deployment!