# Adreel Academy: Vercel deployment

This is a static website. There is no build step and nothing to install on Vercel.

## Files
- `index.html`: the whole website (HTML, CSS and JavaScript)
- `media/`: your sample videos and images
- `data/`: the encrypted course (video links are locked inside) and the list of valid access codes. Upload this folder.
- `tools/`: small scripts to add or revoke access codes (need Node.js on your computer)
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
- `paymentEndpoint`: optional form URL that receives the transaction ID a customer submits (if empty, it is sent to your email). Verify each payment in PayU, then send the customer one access code.
- `contact`: email is set. Add `phone` or `whatsapp` if you want them shown.
- `leadEndpoint`: the free guide form only saves data when this is filled. Paste the form URL from Formspree, Brevo, ConvertKit or similar. Until then the form shows "Preview mode" and saves nothing.
- `ga4Id`: your Google Analytics 4 id (G-XXXXXXXXXX) to track clicks, video plays and leads.
- `faq`: replace every answer in [square brackets] (tools taught, device needs, subscriptions, self-paced, access time, refund).
- `refundPolicy`: write your real refund policy. Privacy policy and Terms are templates, have them reviewed before launch.
- `instructor.bio`: add more of your own experience if you like.
- `showcase` and `demoVideo`: swap in your own videos and images in `media/`.
- Optional timed offer: `offer:{price:'499',endsAt:'2026-11-01T23:59:00+05:30'}` shows a countdown until that time, then goes back to the normal price.

## Notes
- Brand logos in your sample videos and photos (for example Meesho) may be trademarked. Use your own or fictional brands where you can.
- Videos are about 11 MB in total. Vercel serves them fine. For many viewers, consider hosting longer videos on YouTube or Vimeo.
- To preview locally: `npx serve .` then open the address it prints.

## Course access (after payment)
Flow: customer pays on PayU, lands on the Thank You page (`#thank-you`), clicks Access Your Course (`#course`) and types a personal access code. The 3 YouTube videos are stored encrypted in `data/course.enc.json`. Only a valid code can unlock them in the browser, so the video links are not readable in the page source.

How to give access to a customer:
1. Check the payment in your PayU dashboard (status Success, amount 499).
2. Take the next unused code from `private/codes.txt` and write the customer's name and date next to it.
3. Send that one code to the customer (WhatsApp or email). One code per customer.

`private/` is NOT part of the website. It holds your secret key, your 100 ready codes and the course video list. It comes in a separate zip. Never upload it to GitHub or Vercel. Keep a backup.

Add more codes (needs Node.js, run inside the project folder with `private/` next to `tools/`):
```
node tools/add-codes.mjs 50      # adds 50 codes, then upload the new data/access.json
```
Revoke a code (for a refund or a shared code):
```
node tools/revoke.mjs ADREEL-XXXX-XXXX-XXXX     # then upload data/access.json
```
Change the video links, titles or descriptions: edit `private/course.json`, run `node tools/build.mjs`, upload `data/course.enc.json`.

Limits you should know:
- This is not an automatic payment check. The website cannot confirm a PayU payment, so you verify payments and send codes yourself. Opening the Thank You page proves nothing.
- Once a customer unlocks the course, they can see the YouTube links, and unlisted videos can be opened by anyone who has the link. A customer can share the links or the code. Revoke a shared code and use one code per customer to limit this.
- Progress ticks are saved only in the customer's own browser.
- For fully automatic access (PayU confirms payment, the customer gets their code by email) you need a small server: PayU merchant key and salt, a PayU webhook, a database and an email service. Ask for it when sales grow.
