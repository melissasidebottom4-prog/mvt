# Hearthstone Demo - Deployment Instructions

## Quick Deploy to Cloudflare Pages

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (free tier works)

### Option 1: Deploy via Wrangler CLI (Recommended)

1. Install Wrangler globally:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Build the project:
```bash
cd hearthstone-demo
npm install
npm run build
```

4. Deploy to Cloudflare Pages:
```bash
wrangler pages deploy dist --project-name=hearthstone-demo
```

5. Your site will be available at:
   - `https://hearthstone-demo.pages.dev`
   - Or a custom domain if configured

### Option 2: Deploy via Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Select "Workers & Pages" from the sidebar
3. Click "Create application" → "Pages"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `cd hearthstone-demo && npm install && npm run build`
   - Build output directory: `hearthstone-demo/dist`
6. Click "Save and Deploy"

### Option 3: Direct Upload

1. Build locally:
```bash
cd hearthstone-demo
npm install
npm run build
```

2. Go to https://dash.cloudflare.com
3. Select "Workers & Pages"
4. Click "Create application" → "Pages" → "Upload assets"
5. Drag and drop the `dist` folder contents
6. Click "Deploy"

## Custom Domain Setup

After deployment, you can add a custom domain:

1. Go to your Pages project in Cloudflare dashboard
2. Click "Custom domains"
3. Add your domain (e.g., `hearthstone.yourdomain.com`)
4. Follow DNS configuration instructions

## Environment Variables (if needed)

For future API integrations:
1. Go to your Pages project settings
2. Click "Environment variables"
3. Add variables as needed

## Local Development

```bash
cd hearthstone-demo
npm install
npm run dev
```

Visit http://localhost:5173

## Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

---

**Bundle Size:** ~206KB (well under 500KB target)
**Build Time:** ~3 seconds
**Supported Browsers:** All modern browsers (ES2020+)
