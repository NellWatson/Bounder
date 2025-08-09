// Automatically commit subscribers.csv when it changes
const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

const CSV_FILE = path.join(__dirname, 'subscribers.csv');

console.log('🔍 Watching subscribers.csv for changes...');
console.log('📁 File:', CSV_FILE);
console.log('🔄 Will auto-commit to Git when emails are added\n');

// Watch for changes
const watcher = chokidar.watch(CSV_FILE, {
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', () => {
  console.log('📝 subscribers.csv changed! Auto-committing...');
  
  // Git add and commit
  exec('git add subscribers.csv && git commit -m "Auto-update subscribers list"', (error, stdout, stderr) => {
    if (error) {
      if (error.message.includes('nothing to commit')) {
        console.log('ℹ️  No changes to commit');
      } else {
        console.error('❌ Git error:', error.message);
      }
      return;
    }
    
    console.log('✅ Committed to Git!');
    console.log(stdout);
    
    // Optional: Auto-push to GitHub
    // Uncomment the next line to enable auto-push
    // exec('git push', (pushError, pushStdout) => {
    //   if (pushError) {
    //     console.error('❌ Push error:', pushError.message);
    //   } else {
    //     console.log('☁️  Pushed to GitHub!');
    //   }
    // });
  });
});

watcher.on('error', error => {
  console.error('❌ Watcher error:', error);
});

console.log('Press Ctrl+C to stop watching\n');