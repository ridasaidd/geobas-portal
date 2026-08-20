#!/usr/bin/env node
/**
 * Aurora Atlas V3 — real-browser screenshot capture (integration evidence).
 *
 * Drives a local headless Chromium over the Chrome DevTools Protocol (no
 * playwright dependency) and captures the 7 shippable screenshots required by
 * VISUAL-IMPLEMENTATION-SPEC.md §6. Light mode (S8) is intentionally NOT
 * captured here: light mode is unshipped in this rebuild (see §6 S8 / §7.6
 * "do not ship before art review"), so 08-home-light.png has no real app state.
 *
 * Usage:
 *   node tests/_capture-screenshots.mjs            # uses defaults below
 *   CHROME_BIN=... BASE_URL=... OUTDIR=... node tests/_capture-screenshots.mjs
 *
 * Requires: a running static server at BASE_URL (python3 -m http.server) and a
 * headless Chromium binary (chromium headless shell, e.g. playwright's
 * chromium_headless_shell).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const CHROME_BIN = process.env.CHROME_BIN ||
  '/opt/hermes/.playwright/chromium_headless_shell-1234/chrome-linux/headless_shell';
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8666/geobas-portal.html';
const OUTDIR = path.resolve(process.env.OUTDIR || path.join(REPO_ROOT, 'review-screenshots'));
const PORT = Number(process.env.CDP_PORT || 9222);
const SETTLE_HOME_MS = Number(process.env.SETTLE_HOME_MS || 8000); // first load: sql.js seed + fonts + globe
const SETTLE_VIEW_MS = Number(process.env.SETTLE_VIEW_MS || 1200); // view switches

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function waitForDebugPort(port, tries = 150) {
  for (let i = 0; i < tries; i++) {
    try { return await getJson(`http://127.0.0.1:${port}/json/version`); } catch { /* retry */ }
    await sleep(200);
  }
  throw new Error(`Chrome DevTools port ${port} never came up`);
}

async function findPageTarget(port) {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await getJson(`http://127.0.0.1:${port}/json/list`);
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* retry */ }
    await sleep(200);
  }
  throw new Error('no page target found on the DevTools endpoint');
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this._id = 0;
    this._pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      if (m.id != null) {
        const p = this._pending.get(m.id);
        if (p) {
          this._pending.delete(m.id);
          m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
        }
      }
    });
  }
  send(method, params = {}) {
    const id = ++this._id;
    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('WebSocket connect timeout')), 10000);
    ws.addEventListener('open', () => { clearTimeout(t); res(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(t); rej(new Error('WebSocket connect failed')); }, { once: true });
  });
  return new CDP(ws);
}

async function evalJS(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) {
    throw new Error('eval error: ' + JSON.stringify(r.exceptionDetails.exception || r.exceptionDetails));
  }
  return r.result ? r.result.value : undefined;
}

async function waitFor(cdp, expression, timeoutMs, label) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await evalJS(cdp, expression)) return true;
    await sleep(250);
  }
  console.warn('  [warn] timed out waiting for:', label);
  return false;
}

async function capture(cdp, outfile) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  fs.writeFileSync(outfile, Buffer.from(r.data, 'base64'));
  return fs.statSync(outfile).size;
}

async function setViewport(cdp, width, height, mobile) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: !!mobile,
    screenWidth: width, screenHeight: height,
  });
}

async function main() {
  fs.mkdirSync(OUTDIR, { recursive: true });

  const chrome = spawn(CHROME_BIN, [
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--remote-allow-origins=*',
    '--hide-scrollbars',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--force-color-profile=srgb',
    '--run-all-compositor-stages-before-draw',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  chrome.stderr.on('data', () => { /* silence chromium chatter */ });
  chrome.on('exit', (code) => { if (code) console.warn('chrome exited with code', code); });
  chrome.on('error', (e) => { throw new Error('failed to launch chrome: ' + e.message); });

  try {
    console.log('waiting for DevTools port', PORT);
    await waitForDebugPort(PORT);
    const target = await findPageTarget(PORT);
    console.log('connecting to', target.webSocketDebuggerUrl);
    const cdp = await connect(target.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 2, g: 8, b: 18, a: 1 } });

    // ---- first load (home) ----
    await setViewport(cdp, 1440, 900, false);
    console.log('navigating to', BASE_URL);
    await cdp.send('Page.navigate', { url: BASE_URL });
    await waitFor(cdp,
      `document.readyState === 'complete' && !!document.getElementById('home-region-table') && document.getElementById('home-region-table').children.length > 0`,
      20000, 'home region table seeded');
    // fonts ready + globe canvas (globe is guarded: missing asset degrades silently)
    await evalJS(cdp, `document.fonts ? document.fonts.ready.then(()=>true).catch(()=>true) : true`);
    await waitFor(cdp, `!!document.querySelector('#globe canvas')`, 6000, 'globe canvas');
    await sleep(SETTLE_HOME_MS);

    // ---- resolve seed ids by slug / name ----
    await evalJS(cdp, `window.__findRegionBySlug = (slug) => { const r = getRegions('sv').find(x => x.slug === slug); return r ? r.id : null; };`);
    await evalJS(cdp, `window.__findCountryByName = (name) => { for (const r of getRegions('sv')) { const c = getCountriesForRegion(r.id, 'sv').find(x => x.name === name); if (c) return c.id; } return null; };`);
    const afrikaId = await evalJS(cdp, `__findRegionBySlug('afrika')`);
    const somaliaId = await evalJS(cdp, `__findCountryByName('Somalia')`);
    const ecuadorId = await evalJS(cdp, `__findCountryByName('Ecuador')`);
    console.log('resolved ids -> afrika:', afrikaId, '| somalia:', somaliaId, '| ecuador:', ecuadorId);
    if (!afrikaId || !somaliaId || !ecuadorId) throw new Error('failed to resolve seed region/country ids');

    const shots = [
      { file: '01-home-dark-desktop.png', width: 1440, height: 900, mobile: false, prep: null },
      { file: '02-regions.png', width: 1440, height: 900, mobile: false, prep: `goRegions();` },
      { file: '03-countries.png', width: 1440, height: 900, mobile: false, prep: `goRegion(${afrikaId});` },
      { file: '04-somalia-dossier.png', width: 1440, height: 900, mobile: false, prep: `goCountry(${somaliaId});` },
      { file: '05-ecuador-dossier.png', width: 1440, height: 900, mobile: false, prep: `goCountry(${ecuadorId});` },
      { file: '06-mobile.png', width: 390, height: 844, mobile: true, prep: `goHome();` },
      { file: '07-home-rtl-arabic.png', width: 1440, height: 900, mobile: false, prep: `currentLang='ar'; applyStaticI18n(); renderLangSwitch(); goHome();` },
    ];

    for (const s of shots) {
      console.log(`capturing ${s.file} (${s.width}x${s.height}, mobile=${s.mobile})`);
      await setViewport(cdp, s.width, s.height, s.mobile);
      if (s.prep) { await evalJS(cdp, s.prep); await sleep(SETTLE_VIEW_MS); }
      else { await sleep(600); }
      const out = path.join(OUTDIR, s.file);
      const bytes = await capture(cdp, out);
      console.log('  wrote', out, `(${bytes} bytes)`);
    }

    console.log('DONE. screenshots written to', OUTDIR);
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
