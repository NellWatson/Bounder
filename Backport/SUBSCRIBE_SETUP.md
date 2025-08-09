# Setting Up the Subscribe Form with Google Sheets

## Step 1: Deploy Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Delete the default code and paste the contents of `google-apps-script.js`
4. Save the project (give it a name like "Slana Subscribe Form")
5. Click "Deploy" → "New Deployment"
6. Settings:
   - Type: Web app
   - Execute as: Me (your account)
   - Who has access: Anyone
7. Click "Deploy"
8. **IMPORTANT: Copy the Web App URL** - it will look like:
   `https://script.google.com/macros/s/AKfycbw.../exec`

## Step 2: Update the Subscribe Form

1. Open `subscribe-form.js` in your code editor
2. Find this line:
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL` with the Web App URL you copied
4. Save the file

## Step 3: Test the Form

1. Push your changes to GitHub
2. Wait a few minutes for GitHub Pages to update
3. Visit your website and test the subscribe form
4. Check your Google Sheet to see if the email was added

## Troubleshooting

- If emails aren't appearing in your sheet, check that:
  - The Sheet ID in the Apps Script matches your sheet
  - The sheet name is correct (default is 'Sheet1')
  - The Web App is deployed with "Anyone" access
  
- To see errors, open Chrome DevTools (F12) and check the Console tab

## Google Sheet Format

The script will add new rows with:
- Column A: Timestamp
- Column B: Email address

You can add headers to your sheet:
| Timestamp | Email |
|-----------|-------|

## Alternative: Use Google Forms

If you prefer a simpler solution, you can:
1. Create a Google Form
2. Link it to your existing spreadsheet
3. Embed the form on your website using an iframe