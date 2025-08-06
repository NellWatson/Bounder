import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONE_DIR = path.join(__dirname, 'bounder_enhanced');

async function addYouTubeAutoplay() {
  console.log('🎬 Adding autoplay to YouTube video...\n');
  
  // Get all HTML files
  const htmlFiles = await fs.readdir(CLONE_DIR);
  const htmlPages = htmlFiles.filter(f => f.endsWith('.html'));
  
  for (const file of htmlPages) {
    console.log(`📝 Processing ${file}...`);
    const filePath = path.join(CLONE_DIR, file);
    let html = await fs.readFile(filePath, 'utf-8');
    
    // Check if this file contains the YouTube video
    if (html.includes('Wjeewz-p14Q')) {
      console.log(`  ✅ Found YouTube video in ${file}`);
      
      // Update all instances of the YouTube embed URL to include autoplay
      // Pattern 1: Basic embed URL
      html = html.replace(
        /src="https:\/\/www\.youtube\.com\/embed\/Wjeewz-p14Q\?wmode=opaque&amp;enablejsapi=1"/g,
        'src="https://www.youtube.com/embed/Wjeewz-p14Q?autoplay=1&mute=1&wmode=opaque&enablejsapi=1"'
      );
      
      // Pattern 2: Protocol-relative URL
      html = html.replace(
        /src="\/\/www\.youtube\.com\/embed\/Wjeewz-p14Q\?wmode=opaque&amp;enablejsapi=1"/g,
        'src="//www.youtube.com/embed/Wjeewz-p14Q?autoplay=1&mute=1&wmode=opaque&enablejsapi=1"'
      );
      
      // Pattern 3: Encoded version in data attributes
      html = html.replace(
        /\/\/www\.youtube\.com\/embed\/Wjeewz-p14Q\?wmode=opaque&amp;amp;enablejsapi=1/g,
        '//www.youtube.com/embed/Wjeewz-p14Q?autoplay=1&amp;mute=1&amp;wmode=opaque&amp;amp;enablejsapi=1'
      );
      
      // Pattern 4: Another encoded version
      html = html.replace(
        /\/\/www\.youtube\.com\/embed\/Wjeewz-p14Q\?wmode=opaque&amp;enablejsapi=1/g,
        '//www.youtube.com/embed/Wjeewz-p14Q?autoplay=1&mute=1&wmode=opaque&enablejsapi=1'
      );
      
      // Add allow attribute for autoplay policy
      html = html.replace(
        /<iframe src="([^"]*youtube\.com\/embed\/Wjeewz-p14Q[^"]*)"([^>]*?)>/g,
        '<iframe src="$1"$2 allow="autoplay; encrypted-media">'
      );
      
      // Also update any data-html attributes that contain the iframe
      html = html.replace(
        /data-html="<iframe src=&quot;([^&]*?)&quot;/g,
        (match, src) => {
          if (src.includes('Wjeewz-p14Q') && !src.includes('autoplay')) {
            const newSrc = src.includes('?') 
              ? src + '&amp;autoplay=1&amp;mute=1'
              : src + '?autoplay=1&amp;mute=1';
            return `data-html="<iframe src=&quot;${newSrc}&quot; allow=&quot;autoplay; encrypted-media&quot;`;
          }
          return match;
        }
      );
      
      await fs.writeFile(filePath, html);
      console.log(`  ✅ Added autoplay parameters to video`);
      console.log(`     - autoplay=1 (starts playing automatically)`);
      console.log(`     - mute=1 (muted to comply with browser autoplay policies)`);
      console.log(`     - allow="autoplay; encrypted-media" (permissions for autoplay)`);
    } else {
      console.log(`  ℹ️ No YouTube video found in ${file}`);
    }
  }
  
  console.log('\n🎯 Autoplay configuration complete!');
  console.log('\n⚠️ Important notes:');
  console.log('  - Video will autoplay when the page loads');
  console.log('  - Video is muted (required by most browsers for autoplay)');
  console.log('  - Users can unmute manually if they want sound');
  console.log('\nTo test:');
  console.log('  cd bounder_enhanced');
  console.log('  python3 -m http.server 8080');
  console.log('  open http://localhost:8080');
  console.log('\n📺 The video should start playing automatically when you load the page!');
}

// Run the update
addYouTubeAutoplay().catch(console.error);