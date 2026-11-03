# Pharmacy Orders — سجل الطلبات

A one-page app for a pharmacy to log what each medical rep orders: item, quantity,
bonus (`10+2`), delivery date, and whether it arrived. English and Arabic, RTL included.

Every pharmacy gets **its own QR code automatically** at setup — type the name, print
the counter sign. It sits at the top of that pharmacy's **Dashboard**, with the totals,
the per-rep table and the per-item table under it; **Main** holds the order cards.
`‹ ›` walk back and forward through the screens you have been on (a two-pointer array,
not the History API — the app has no URLs to push).

The sign holds a link (`…/#p=CODE&n=NAME`), not a bare code, so scanning it opens the
app rather than showing raw text.

**The rep fills the order in on their own phone.** They scan the counter sign, which
opens the app for that pharmacy; they type the items and bonuses; their screen then
shows a QR holding the whole order. The pharmacy photographs it from their own app
(*+ New order → Open camera*) and it lands in their log. Phone to phone, nothing
uploaded, works with no signal, and the rep's phone remembers them so the next
pharmacy autofills.

The rep's phone also **keeps what it handed over** (`S.handed`, local only — it is the
rep's own record, not the pharmacy's). Opening the app cold shows that history instead of
a pharmacy setup form, newest first, with the pharmacy on each card, and each one can be
shown again as the same code if a scan failed. `repMode` is what keeps a rep's phone out
of the pharmacy screens, including on a language switch.

Opened on the pharmacy's own phone the sign goes straight to a blank order instead,
which is what the scan was for.

**Quantity and bonus are separate boxes.** A `10+2` pasted into the quantity box still
splits itself, so nothing that used to work stopped working.

**Tapping a rep's number opens WhatsApp** with the reminder already written — in Arabic
whatever language the app is in, because the rep is the one reading it. It names every
item, its bonus, the date the order was placed and the delivery date agreed. On the Reps
tab one message covers everything that rep still owes. `waNumber` turns `07xx xxx xxxx`
into `9647xx…` and leaves a number that already carries the country code alone.

## Who can see what

- An order is stamped with the pharmacy code it was taken under, and `ownOrders()` is the
  only door into the list, the dashboard and the export. One pharmacy's log cannot show
  another's orders even if both ever landed on one phone.
- A rep who scans the counter sign gets a blank order form and nothing else — no list,
  no dashboard, no nav. The sign carries a code and a name, which let you *send* an
  order, never read one.
- `unpackOrder` refuses an order filled in for a different pharmacy's code.
- The orders live in `localStorage` on the pharmacy's own phone. On the hosted site
  nothing is uploaded; there is no account and no shared database. Inside the Claude
  artifact they are also mirrored to that artifact's own `db`, declared `read:"admin"`
  so a shared link cannot read them.
- Dashboard → **Erase everything on this phone** wipes the lot, two taps, and deletes the
  `db` copies too when there is one. That is the control the privacy claim rests on.

Two limits worth knowing. The hand-off QR is capped at **77 modules** (`HANDOFF_MAX_MODULES`)
— not because more will not encode, but because a camera reading another phone's screen
needs roughly 4 CSS px per module and there are only ~320 to go round. That is about nine
items in Latin script, fewer in Arabic, which takes two bytes per letter; past it the app
refuses and asks for two shorter orders. And the encoder's default byte mode truncates
char codes to 8 bits, which turns `علي` into `9DJ` — `qrcode.stringToBytes` is switched to
the library's UTF-8 function at startup, and a round-trip check guards it.

No build step, no server, no accounts. Every pharmacy's data stays on their own phone.

**Live:** https://maytham-altaan.github.io/pharmacy-orders/ — open it on a phone and
use *Add to Home Screen*.

## Files

| File | |
|---|---|
| `index.html` | the whole app — markup, styles, logic |
| `sw.js` | offline cache |
| `manifest.webmanifest` | makes it installable as an app |
| `icon-*.png`, `apple-touch-icon.png` | home-screen icons |
| `sw.test.js` | `node sw.test.js` — checks the cache logic |

Two CDN scripts, both pinned: `jsqr` reads a QR, `qrcode-generator` writes one.
The service worker caches both, so the app still scans and prints offline.

The app's own checks live in `index.html`: open it at `#selfcheck`, or run them headless.
`#selfcheck` also runs four checks node cannot: it encodes the sign and a rep's order,
rasterises the SVG each really draws, decodes them back with `jsQR`, and compares — in
Latin and in Arabic. Those are the only checks that prove a camera can read what the app
puts in front of it.

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
