# Sayada VidGen - Video Generation Platform

A modern Next.js 15 application built with TypeScript and Tailwind CSS.

## 🚀 Features

- **Next.js 15** - Latest version with improved performance and features
- **React 19** - Latest React version with enhanced capabilities
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development

## 🚀 Async Queue Processing for n8n Integration

### API Workflow (Async Pattern)

1. **Submit Job** - POST request to `/api/v1/generate`
   - Returns immediate response with `job_id` and status `"queued"`
   - Job is enqueued in `social_render_queue`

2. **Queue Processor** - Background worker processes jobs
   - Endpoint: `/api/queue/process`
   - Triggered by cron job every minute
   - Picks highest priority pending jobs
   - Executes FFmpeg rendering with aspect ratio and subtitle burn-in
   - Uploads result to Supabase Storage

3. **Webhook Callback** - Fires when job completes
   - Sends POST to configured `webhook_url`
   - Payload includes `job_id`, `status`, and `video_url`
   - Retries on failure (up to 3 attempts)

### Example Usage (n8n)

```javascript
// Step 1: Submit job
const response = await fetch('https://your-domain.com/api/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "Create a vertical TikTok promo for our new product",
    aspect_ratio: "9:16",
    burn_subtitles: true,
    template: "high_energy_promo",
    webhook_url: "https://your-n8n-webhook.com/video-complete"
  })
});

const { job_id, status } = await response.json();
// Returns: { job_id: "uuid", status: "queued", estimated_completion_time: "..." }

// Step 2: Wait for webhook (n8n automatically receives this)
// Webhook payload when complete:
{
  "job_id": "uuid",
  "project_id": "uuid",
  "status": "completed",
  "video_url": "https://storage.supabase.co/renders/uuid.mp4",
  "aspect_ratio": "9:16",
  "processing_time_seconds": 120,
  "timestamp": "2026-01-07T03:30:00Z"
}
```

### Setting Up Queue Processor (Cron)

Add to your deployment platform (Vercel, Railway, etc.):

```bash
# Cron expression: Every minute
* * * * *

# Endpoint to call
POST https://your-domain.com/api/queue/process
Authorization: Bearer YOUR_CRON_SECRET
```

Or use Vercel Cron Jobs:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/queue/process",
    "schedule": "* * * * *"
  }]
}
```

### Environment Variables

```bash
# Required for queue processor
CRON_SECRET=your-secure-cron-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

## 🛠️ Installation

1. Install dependencies:
  ```bash
  npm install
  # or
  yarn install
  ```

2. Start the development server:
  ```bash
  npm run dev
  # or
  yarn dev
  ```
3. Open [http://localhost:4028](http://localhost:4028) with your browser to see the result.

## 📁 Project Structure

```
nextjs/
├── public/             # Static assets
├── src/
│   ├── app/            # App router components
│   │   ├── layout.tsx  # Root layout component
│   │   └── page.tsx    # Main page component
│   ├── components/     # Reusable UI components
│   ├── styles/         # Global styles and Tailwind configuration
├── next.config.mjs     # Next.js configuration
├── package.json        # Project dependencies and scripts
├── postcss.config.js   # PostCSS configuration
└── tailwind.config.js  # Tailwind CSS configuration

```

## 🧩 Page Editing

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## 🎨 Styling

This project uses Tailwind CSS for styling with the following features:
- Utility-first approach for rapid development
- Custom theme configuration
- Responsive design utilities
- PostCSS and Autoprefixer integration

## 📦 Available Scripts

- `npm run dev` - Start development server on port 4028
- `npm run build` - Build the application for production
- `npm run start` - Start the development server
- `npm run serve` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## 📱 Deployment

Build the application for production:

  ```bash
  npm run build
  ```

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🙏 Acknowledgments

- Built with [Rocket.new](https://rocket.new)
- Powered by Next.js and React
- Styled with Tailwind CSS

Built with ❤️ on Rocket.new