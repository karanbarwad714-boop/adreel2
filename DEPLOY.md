# Adreel Academy: Vercel deployment

This is a static website. There is no build step and nothing to install.

## Files
- `index.html`: the whole website (HTML, CSS and JavaScript)
- `media/`: your videos and images
- `vercel.json`: Vercel settings (caching and security headers)
- `package.json`: project info for Vercel and Git

## Option 1: Vercel website (easiest)
1. Unzip this folder.
2. Go to vercel.com and sign in.
3. Click Add New, then Project, then drag the unzipped folder in (or import it from GitHub, see Option 3).
4. Framework Preset: Other. Leave Build Command and Output Directory empty.
5. Click Deploy. Your site opens on a vercel.app address.

## Option 2: Vercel CLI
```
npm i -g vercel
cd adreel-academy-site
vercel          # preview deployment
vercel --prod   # production deployment
```

## Option 3: GitHub
1. Create a GitHub repository and upload everything in this folder.
2. In Vercel choose Add New, Project, import the repository.
3. Framework Preset: Other. Deploy. Every later push to GitHub redeploys automatically.

## Custom domain
Vercel project, Settings, Domains, Add. Then add the DNS records Vercel shows at your domain registrar.

## Things to edit before sharing the link widely
Open `index.html` and search for `const SITE=`. Everything is in that one block:
- `price` and `originalPrice`: now 499 and 999. Keep your PayU link amount the same (499).
- `checkoutUrl`: your PayU payment link (https://u.payu.in/PAYUMN/GrALUHeWiDlC). All Enroll and Get Access buttons open it. Set the success redirect inside PayU to your site address followed by `#thank-you`.
- `paymentEndpoint`: optional form URL that receives the transaction ID a customer submits (if empty, it is sent to your email). Verify each payment in PayU, then send the Telegram link to the customer. The Telegram link is deliberately not stored on the site.
- `contact`: email is set. Add `phone` or `whatsapp` if you want them shown.
- `leadEndpoint`: the free guide form only saves data when this is filled. Paste the form URL from Formspree, Brevo, ConvertKit or similar. Until then the form shows "Preview mode" and saves nothing.
- `ga4Id`: your Google Analytics 4 id (G-XXXXXXXXXX) to track clicks, video plays and leads.
- `faq`: replace every answer in [square brackets] (tools taught, device needs, subscriptions, self-paced, access time, refund, after payment).
- `refundPolicy`: write your real refund policy. Privacy policy and Terms are templates, have them reviewed before launch.
- `instructor.bio`: add more of your own experience if you like.
- `showcase` and `demoVideo`: swap in your own videos and images in `media/`.
- Optional timed offer: `offer:{price:'499',endsAt:'2026-11-01T23:59:00+05:30'}` shows a countdown until that time, then goes back to the normal price.

## Notes
- Brand logos in your sample videos and photos (for example Meesho) may be trademarked. Use your own or fictional brands where you can.
- Videos are about 11 MB in total. Vercel serves them fine. For many viewers, consider hosting longer videos on YouTube or Vimeo.
- To preview locally: `npx serve .` then open the address it prints.
