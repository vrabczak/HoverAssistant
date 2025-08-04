const fs = require('fs');
const path = require('path');

/**
 * Create a data URL version of the helicopter hover assistant
 * that can be bookmarked and used without any server
 */
function createDataURL() {
    try {
        // Read the built HTML file
        const htmlPath = path.join(__dirname, 'dist', 'helicopter-hover-assistant.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Create data URL
        const dataURL = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

        // Create a simple HTML file with the data URL as a link
        const bookmarkHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Helicopter Hover Assistant - Data URL</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: #1a1a1a; 
            color: #00ff00; 
        }
        .container { max-width: 600px; margin: 0 auto; }
        .link { 
            display: block; 
            padding: 15px; 
            background: #333; 
            color: #00ff00; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 0; 
            text-align: center;
        }
        .instructions { 
            background: #2a2a2a; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚁 Helicopter Hover Assistant</h1>
        
        <div class="instructions">
            <h3>📱 Mobile Installation Instructions:</h3>
            <ol>
                <li><strong>Tap the link below</strong> to open the app</li>
                <li><strong>Bookmark it</strong> (⭐) for offline access</li>
                <li><strong>Add to Home Screen</strong> for app-like experience</li>
                <li><strong>Grant GPS permissions</strong> when prompted</li>
            </ol>
            
            <p><strong>Note:</strong> This data URL contains the complete app and works offline once bookmarked!</p>
        </div>
        
        <a href="${dataURL}" class="link">
            🚁 Launch Helicopter Hover Assistant
        </a>
        
        <div class="instructions">
            <h3>🔧 If GPS doesn't work:</h3>
            <ul>
                <li>Try opening in <strong>Firefox Mobile</strong> instead of Chrome</li>
                <li>Or enable Chrome flags: <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></li>
            </ul>
        </div>
    </div>
</body>
</html>`;

        // Write the bookmark file
        const bookmarkPath = path.join(__dirname, 'dist', 'helicopter-hover-assistant-bookmark.html');
        fs.writeFileSync(bookmarkPath, bookmarkHTML);

        console.log('✅ Data URL version created!');
        console.log(`📁 File: ${bookmarkPath}`);
        console.log(`📏 Data URL length: ${dataURL.length} characters`);
        console.log('\n🚁 Instructions:');
        console.log('1. Copy helicopter-hover-assistant-bookmark.html to your Android device');
        console.log('2. Open it in Chrome or Firefox');
        console.log('3. Tap the launch link and bookmark it');
        console.log('4. Use the bookmark for offline access');

    } catch (error) {
        console.error('❌ Error creating data URL:', error.message);
        console.log('\n💡 Make sure to run "npm run build" first!');
    }
}

// Run if called directly
if (require.main === module) {
    createDataURL();
}

module.exports = { createDataURL };
