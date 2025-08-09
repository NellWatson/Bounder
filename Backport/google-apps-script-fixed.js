// Google Apps Script - Deploy this as a Web App
// IMPORTANT: Copy this entire code to your Google Apps Script project

function doPost(e) {
  try {
    // Get the active spreadsheet (the one where this script is attached)
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get current timestamp
    const timestamp = new Date();
    
    // Append row with email and timestamps
    sheet.appendRow([
      data.email,
      data.timestamp || timestamp.toISOString(),
      timestamp.toLocaleString() // Human readable timestamp
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        'result': 'success',
        'message': 'Email added successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*'
      });
      
  } catch (error) {
    // Log error for debugging
    console.error('Error in doPost:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        'result': 'error',
        'message': error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*'
      });
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  return ContentService
    .createTextOutput('Slana Subscribe Endpoint Active - Use POST to submit emails')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Test function to verify script has access to sheet
function testSheetAccess() {
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.getRange(1, 1).setValue('Email');
  sheet.getRange(1, 2).setValue('Timestamp (ISO)');
  sheet.getRange(1, 3).setValue('Timestamp (Local)');
}