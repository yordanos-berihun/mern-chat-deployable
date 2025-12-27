# Feature #9: Link Previews

## Implementation Summary
Automatically detect URLs in messages and display rich preview cards with metadata (title, description, image).

## Backend Changes

### New Route: `link-preview.js`
- **GET /api/link-preview?url=...** - Fetch URL metadata
- Uses native Node.js `http`/`https` modules (no external dependencies)
- Extracts Open Graph and Twitter Card metadata from HTML
- In-memory cache with 1-hour TTL
- 500KB response size limit
- 5-second timeout protection

### Metadata Extraction
Parses HTML for:
1. **Title**: og:title → twitter:title → <title> tag → URL
2. **Description**: og:description → twitter:description → meta description
3. **Image**: og:image → twitter:image

### Server Integration
Added route to `server.js`: `app.use('/api/link-preview', require('./routes/link-preview'))`

## Frontend Changes

### New Component: `LinkPreview.js`
- Accepts `url` and `apiCall` props
- Fetches preview data on mount
- Displays card with image, title, description, hostname
- Opens link in new tab on click
- Graceful error handling (hides on failure)

### Integration in `EnhancedChatApp.js`
- Added URL regex detection in `MessageItem`: `/(https?:\/\/[^\s]+)/g`
- Extracts URLs from text messages
- Renders up to 2 link previews per message
- Passes `apiCall` to `MessageItem` and `LinkPreview`

### Styling: `LinkPreview.css`
- Card layout with image thumbnail (80x80px)
- Hover effect
- Text truncation (title: 1 line, description: 2 lines)
- Dark mode support via CSS variables
- Max width 400px

## Features

### Automatic Detection
- ✅ Detects `http://` and `https://` URLs in messages
- ✅ Extracts multiple URLs (shows first 2)
- ✅ Works with any website supporting Open Graph/Twitter Cards

### Rich Previews
- ✅ Thumbnail image (if available)
- ✅ Page title
- ✅ Description (2-line truncation)
- ✅ Hostname display
- ✅ Click to open in new tab

### Performance
- ✅ Server-side caching (1 hour)
- ✅ Lazy loading (only fetches when message visible)
- ✅ Timeout protection (5 seconds)
- ✅ Size limit (500KB)
- ✅ Graceful degradation on errors

## Usage

1. **Send Message with URL**: Type message containing `https://example.com`
2. **Auto Preview**: Link preview card appears below message
3. **Click Preview**: Opens URL in new browser tab
4. **Multiple Links**: Shows up to 2 previews per message

## Technical Details

### URL Detection Regex
```javascript
const urlRegex = /(https?:\/\/[^\s]+)/g;
const urls = message.content.match(urlRegex);
```

### Metadata Priority
1. Open Graph tags (Facebook standard)
2. Twitter Card tags
3. Standard HTML meta tags
4. Fallback to URL

### Security
- URL validation before fetching
- Response size limits
- Timeout protection
- No external dependencies (uses Node.js built-ins)
- Opens links with `rel="noopener noreferrer"`

### Cache Strategy
- In-memory Map storage
- 1-hour TTL per URL
- Reduces redundant fetches
- Automatic cleanup on expiry

## Example Preview Card

```
┌─────────────────────────────────┐
│ [Image]  │ Page Title           │
│  80x80   │ Short description... │
│          │ example.com          │
└─────────────────────────────────┘
```

## Limitations

- Shows max 2 previews per message
- Requires Open Graph/Twitter Card metadata
- 5-second fetch timeout
- 500KB response limit
- Cache limited to server memory

## Progress Update
**9 of 12 features complete (75%)**

Remaining features:
- Cloud Storage (AWS S3)
- Voice/Video Calls
- Message Pagination UI
