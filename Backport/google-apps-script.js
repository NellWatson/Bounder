// Google Apps Script - Deploy this as a Web App
// 1. Go to https://script.google.com
// 2. Create a new project
// 3. Paste this code
// 4. Update SHEET_ID with your sheet ID from the URL
// 5. Deploy > New Deployment > Web App
// 6. Set execute as "Me" and access to "Anyone"
// 7. Copy the Web App URL

const SHEET_ID = '1x8pFCiYq9fy_RtnzI_dxwWCNWmwFI4qDyaRTmfbqpv4';
const SHEET_NAME = 'Sheet1'; // Update if your sheet has a different name

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const email = e.parameter.email;
    const timestamp = new Date();
    
    // Append the new row
    sheet.appendRow([timestamp, email]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        'result': 'success',
        'message': 'Email added successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        'result': 'error',
        'message': error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return doPost(e);
}