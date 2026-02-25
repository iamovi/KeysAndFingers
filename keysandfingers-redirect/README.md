# Keys&Fingers Redirect

This repository contains a simple redirect from Vercel to Cloudflare Pages.

## 🎯 Purpose

- **Share URL:** `keysandfingers.vercel.app` (professional looking)
- **Actual Site:** `keysandfingers.pages.dev` (fast Cloudflare hosting)

## 🔧 How It Works

1. User visits `keysandfingers.vercel.app`
2. Social media crawlers read meta tags (for nice preview cards)
3. Users get instantly redirected to `keysandfingers.pages.dev`
4. Site loads fast from Cloudflare's global CDN

## 📊 Benefits

✅ Professional Vercel URL for sharing  
✅ Fast Cloudflare Pages performance  
✅ Beautiful social media previews  
✅ Best of both worlds!

## 🚀 Deployment

This project is automatically deployed to Vercel when pushing to the main branch.

### Manual Deployment

```bash
# Clone this repo
git clone [your-repo-url]
cd keysandfingers-redirect

# Deploy to Vercel
vercel --prod
```

## 📱 Social Media Preview

When someone shares `keysandfingers.vercel.app` on social media, they'll see:

- **Title:** Keys&Fingers - Advanced Typing Trainer
- **Description:** Improve your typing speed with multiplayer battles, real-time WPM tracking...
- **Image:** Preview image from main site
- **URL:** keysandfingers.vercel.app

## 🔗 Links

- **Main Project:** [KeysAndFingers GitHub](https://github.com/[your-username]/KeysAndFingers)
- **Live Site (Vercel):** https://keysandfingers.vercel.app
- **Live Site (Cloudflare):** https://keysandfingers.pages.dev

## 🛠️ Files

- `index.html` - Landing page with meta tags and redirect
- `vercel.json` - Vercel configuration for redirects and headers
- `README.md` - This file

## 📝 Notes

- The redirect uses `307` (Temporary Redirect) to preserve POST requests
- Social media crawlers read meta tags before following redirects
- JavaScript redirect for instant user experience
- Meta refresh fallback for non-JS browsers

## 📄 License

MIT License - Same as main KeysAndFingers project

---

Created by [Your Name] | Main Project by Ovi ren
