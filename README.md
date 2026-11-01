# Pharmacy Orders — سجل الطلبات

A one-page app for a pharmacy to log what each medical rep orders: item, quantity,
bonus (`10+2`), delivery date, and whether it arrived. English and Arabic, RTL included.

No build step, no server, no accounts. Every pharmacy's data stays on their own phone.

## Files

| File | |
|---|---|
| `index.html` | the whole app — markup, styles, logic |
| `sw.js` | offline cache |
| `manifest.webmanifest` | makes it installable as an app |
| `icon-*.png`, `apple-touch-icon.png` | home-screen icons |
| `sw.test.js` | `node sw.test.js` — checks the cache logic |

The app's own checks live in `index.html`: open it at `#selfcheck`, or run them headless:

```
node -e 'const s=require("fs").readFileSync("index.html","utf8");eval(s.split("/*pure*/")[1].split("/*endpure*/")[0]);const r=selfcheck();console.log(r.filter(x=>!x[0]).length?"FAILED":"all "+r.length+" pass")'
```

## Publishing it

Any static host works. It must be **https**, or the camera will not open.

**Netlify Drop** — no account, fastest test. Go to app.netlify.com/drop and drag this
folder onto the page. You get a URL in about ten seconds.

**Cloudflare Pages** — for the real one, free, custom domain. dash.cloudflare.com →
Workers & Pages → Create → Pages → Upload assets → drag this folder.

**GitHub Pages** — from this folder:

```
gh repo create pharmacy-orders --public --source=. --push
```

Then in the repo: Settings → Pages → Source: `main`, folder `/root`.
The URL is `https://<your-github-name>.github.io/pharmacy-orders/`.

## Giving it to a pharmacist

Send the link. On the phone: open it, then **Add to Home Screen** (Safari: Share →
Add to Home Screen; Chrome: ⋮ → Add to home screen). It then opens like an app,
full screen, and works with no signal.

Each pharmacy gets its own copy of the data because the data never leaves their phone.
Nothing is uploaded, so there is no shared database and no account to break into.
Their backup is the **CSV export** on the Summary tab — worth doing monthly.

## Updating it

Edit `index.html`, bump `CACHE` in `sw.js` (`pharmacy-orders-v1` → `-v2`), and
re-upload. Phones pick up the new version the next time they open it with a signal.
