// Runs sw.js against a mock Cache/fetch to check the two caching branches.
// node sw.test.js
const fs = require("fs"), assert = require("assert"), vm = require("vm");

function makeResponse(tag, { ok = true, type = "basic" } = {}) {
  let used = false;
  const r = {
    tag, ok, type,
    clone() { assert.ok(!used, "clone() after the body was handed on — " + tag); return makeResponse(tag, { ok, type }) },
    consume() { assert.ok(!used, "body used twice — " + tag); used = true }
  };
  return r;
}

function run({ navigateFails = false, cacheHit = null } = {}) {
  const store = new Map();
  const listeners = {};
  const fetched = [];
  const cacheApi = {
    open: async () => ({
      addAll: async urls => urls.forEach(u => store.set(u, makeResponse("core:" + u))),
      put: async (k, v) => { v.consume(); store.set(typeof k === "string" ? k : k.url, v) },
      keys: async () => [...store.keys()]
    }),
    match: async k => (typeof k === "string" ? store.get(k) : cacheHit) || undefined,
    keys: async () => ["old-cache"],
    delete: async () => true
  };
  const ctx = {
    self: {
      addEventListener: (n, f) => (listeners[n] = f),
      skipWaiting: () => {}, clients: { claim: () => {} }
    },
    caches: cacheApi,
    fetch: async req => { fetched.push(req.url); if (navigateFails) throw new Error("offline"); return makeResponse("net:" + req.url) }
  };
  ctx.self.caches = cacheApi;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync("sw.js", "utf8"), ctx);
  return { listeners, store, fetched, respond: req => new Promise(res => listeners.fetch({ request: req, respondWith: p => res(p) })) };
}

(async () => {
  // install precaches the app shell
  const a = run();
  await new Promise(r => a.listeners.install({ waitUntil: p => p.then(r) }));
  assert.ok(a.store.has("./index.html"), "install precaches index.html");
  assert.ok(a.store.has("./icon-192.png"), "install precaches the icon");

  // a page load online goes to the network and refreshes the cached copy
  const b = run();
  const fresh = await b.respond({ method: "GET", mode: "navigate", url: "/" });
  assert.equal(fresh.tag, "net:/", "online page load comes from the network");
  await new Promise(r => setImmediate(r));
  assert.equal(b.store.get("./index.html").tag, "net:/", "the cached copy is refreshed");

  // the same load offline falls back to the cached app
  const c = run({ navigateFails: true });
  await new Promise(r => c.listeners.install({ waitUntil: p => p.then(r) }));
  const off = await c.respond({ method: "GET", mode: "navigate", url: "/" });
  assert.equal(off.tag, "core:./index.html", "offline page load serves the cached app");

  // assets come from the cache without touching the network
  const d = run({ cacheHit: makeResponse("cached:font") });
  const asset = await d.respond({ method: "GET", mode: "no-cors", url: "https://fonts.gstatic.com/x.woff2" });
  assert.equal(asset.tag, "cached:font", "cached asset served from the cache");
  assert.equal(d.fetched.length, 0, "cached asset does not hit the network");

  // an uncached asset is fetched and kept
  const e = run();
  const miss = await e.respond({ method: "GET", mode: "cors", url: "https://cdn.jsdelivr.net/jsQR.js" });
  assert.equal(miss.tag, "net:https://cdn.jsdelivr.net/jsQR.js", "uncached asset fetched");
  await new Promise(r => setImmediate(r));
  assert.ok(e.store.has("https://cdn.jsdelivr.net/jsQR.js"), "uncached asset is stored for next time");

  console.log("all 8 service worker checks pass");
})().catch(err => { console.error("FAIL:", err.message); process.exit(1) });
