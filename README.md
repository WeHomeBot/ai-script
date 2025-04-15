# AI-Script

Provides AI scripts that can run in the browser.

## Usage

### Direct Use in Browser

```html
  <script src="https://cdn.jsdelivr.net/npm/ai-script@latest/dist/ai-script.umd.js" appKey="sk-262**********62b" baseUrl="https://api.deepseek.com" model="deepseek-chat"></script>
```
### Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI-Script Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .demo-container {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    input {
      padding: 8px;
      width: 300px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      padding: 8px 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #45a049;
    }
    #result {
      margin-top: 20px;
      padding: 10px;
      background-color: #e9f7ef;
      border-radius: 4px;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/ai-script@latest/dist/ai-script.umd.js" appKey="sk-262**********62b" baseUrl="https://api.deepseek.com" model="deepseek-chat"></script>
</head>
<body>
  <h1>AI-Script Demo</h1>
  
  <div class="demo-container">
    <h2>Try it out</h2>
    <p>Press button to add count: <span>0</span> clicks</p>
    
    <button>Click me</button>
  </div>

  <script type="ai">
    Increment the click count by 1 each time the button is clicked
  </script>
</body>
</html>
```

## Development

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

This will start a development server, and you can access the example page in your browser at `http://localhost:5173`.

### Build Library

```bash
npm run build
```

This will generate the following files in the `dist` directory:
- `ai-script.es.js` - ES module format
- `ai-script.umd.js` - UMD format
- TypeScript type definition files

### Run Tests

```bash
npm test
```

## Events and Overlay

AI-Script dispatches the following events during processing:

- `ai-script-start` - Triggered when AI starts processing the prompt
- `ai-script-complete` - Triggered when AI completes processing the prompt

### Processing Overlay

By default, the example page includes a processing overlay that is displayed when AI starts processing and hidden when it completes. You can customize or disable this feature as follows:

```html
<!-- Overlay HTML structure -->
<div class="ai-processing-overlay">
  <div class="ai-processing-content">
    <div class="ai-processing-spinner"></div>
    <p>AI is processing, please wait...</p>
  </div>
</div>

<!-- Event listeners -->
<script>
  // Get overlay element
  const overlay = document.querySelector('.ai-processing-overlay');
  
  // Listen for AI processing start event
  document.addEventListener('ai-script-start', function(event) {
    // Show overlay
    overlay.classList.add('active');
    // You can access event.detail for more information
    console.log('AI processing started:', event.detail);
  });
  
  // Listen for AI processing complete event
  document.addEventListener('ai-script-complete', function(event) {
    // Hide overlay
    overlay.classList.remove('active');
    // You can access event.detail for more information
    console.log('AI processing completed:', event.detail);
  });
</script>
```

### Custom Overlay Styles

You can customize the appearance of the overlay by modifying the CSS:

```css
/* Modify overlay background */
.ai-processing-overlay {
  background-color: rgba(0, 0, 0, 0.7); /* Darker background */
}

/* Modify content box style */
.ai-processing-content {
  background-color: #f0f0f0;
  border-left: 4px solid #4CAF50;
}

/* Modify loading animation color */
.ai-processing-spinner {
  border-top-color: #ff5722; /* Orange loading indicator */
}
```

## Caching Mechanism

AI-Script has a built-in caching feature that can significantly improve performance and reduce API calls. When the same prompt is used multiple times in the same page context, the caching mechanism will directly return the previous result instead of calling the API again.

### Cache Configuration

You can configure the caching feature as follows:

```html
<script 
  src="https://cdn.jsdelivr.net/npm/ai-script@latest/dist/ai-script.umd.js" 
  appKey="your-api-key" 
  baseUrl="https://api.example.com" 
  model="model-name"
  enableCache="true"
  cacheExpiration="2592000000">
</script>
```

### Configuration Options

- `enableCache`: Boolean value that controls whether caching is enabled, default is `true`
- `cacheExpiration`: Cache expiration time (milliseconds), default is 30 days (2592000000 milliseconds)

### How Caching Works

1. When AI-Script processes a prompt, it first calculates a hash value of the current page DOM structure
2. It combines the DOM hash with the prompt content to generate a unique cache key
3. It checks if a corresponding cache item exists in localStorage and has not expired
4. If there's a cache hit, it directly uses the cached result and triggers the `ai-script-complete` event
5. If there's a cache miss, it calls the API and stores the result in the cache

### Clearing the Cache

Cache data is stored in the browser's localStorage, and you can manually clear it as follows:

```javascript
// Clear all AI-Script cache
localStorage.removeItem('ai-script-cache');
```

### Debugging Cache

Enable debug mode to view cache-related log information in the console:

```html
<script 
  src="https://cdn.jsdelivr.net/npm/ai-script@latest/dist/ai-script.umd.js" 
  appKey="your-api-key" 
  debug="true">
</script>
```

With debug mode enabled, the console will display information about cache hits, cache storage, and cache cleaning.

## License

MIT