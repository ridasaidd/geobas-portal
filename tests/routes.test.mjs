// Per-route functional verification for geobas-portal.html (business layer).
// For EVERY route — home, regions, countries, country dossier, resources,
// about, and the country-dossier editor — this drives the REAL inline script
// and asserts BOTH (a) a behavioral assertion (route/view resolves, no dead
// nav) AND (b) a visible-content check (the expected entity/label actually
// renders into the DOM). Also verifies i18n per-language + Arabic RTL dir,
// entity correctness (Somalia, Ecuador), and (as module-level source checks)
// RTL/reduced-motion CSS, the import/export + sanitizer wiring, and that no
// new unsafe sink was added.
//
// Run: node tests/routes.test.mjs   (needs tests/node_modules/parse5)
import fs from 'node:fs';
import { readInlineScript, buildEnv, runSandbox, summarize } from './_harness.mjs';
import { HTML_PATH } from './_harness.mjs';

const html = fs.readFileSync(HTML_PATH, 'utf8');
const inlineScript = readInlineScript();

const TEST_CODE = `
const __results = [];
function __check(name, cond, detail){ __results.push({ name: name, pass: !!cond, detail: detail || '' }); }

// ---------- route data stubs: Afrika -> Somalia, Sydamerika -> Ecuador ----------
const R1 = { id:1, slug:'afrika', lat:2, lng:20, name:'Afrika', translated:true, countryCount:1 };
const R2 = { id:2, slug:'sydamerika', lat:-2, lng:-76, name:'Sydamerika', translated:true, countryCount:1 };
const SOM_CARD = { id:601, title:'Handel & hamn', body:['<p>Hamnen i Mogadishu är viktig för handeln.</p>'], kv:[{ k:'Sektor', v:'Handel' }] };
getRegions = () => [R1, R2];
getRegionById = (id) => { const r=[R1,R2].find(x=>x.id===id); return r || null; };
getCountriesForRegion = (regionId, lang) =>
  regionId===1 ? [{ id:61, name:'Somalia', translated:true, hasContent:true }]
  : regionId===2 ? [{ id:62, name:'Ecuador', translated:true, hasContent:true }]
  : [];
getCountryDetail = (cid, lang) => {
  if(cid===61) return { name:'Somalia', intro:'Östligaste landet på Afrikas horn.', translated:true, cards:[SOM_CARD] };
  if(cid===62) return { name:'Ecuador', intro:'Kuststat i Sydamerika vid ekvatorn.', translated:false, cards:[] };
  return { name:'?', intro:'', translated:false, cards:[] };
};
findRegionForCountry = (cid) => cid===61 ? R1 : (cid===62 ? R2 : null);
getNgos = (cid, lang) => cid===61 ? [{ id:611, name:'IOM Somalia', url:'https://iom.int/', note:'Stöd till återvändare.' }] : [];
getOrgDirectory = (lang) => [{ id:1, name:'Migrationsverket', url:'https://migrationsverket.se/', contact:'', description:'Svensk myndighet.' }];
currentLang = 'sv';
editMode = false;

// ============ HOME ============
goHome();
__check('home: view-home is active', document._views.get('view-home').classList.contains('active'));
const ht = document.getElementById('home-region-table').innerHTML;
__check('home: renders region row Afrika (visible)', ht.indexOf('Afrika')>=0 && ht.indexOf('data-region-id="1"')>=0);
__check('home: renders region row Sydamerika (visible)', ht.indexOf('Sydamerika')>=0 && ht.indexOf('data-region-id="2"')>=0);
__check('home: region index attribute-safe (no raw quotes)', ht.indexOf('" onclick="')<0);
__check('home: stepper shows 3 steps', (document.getElementById('stepper').innerHTML.match(/step-no/g)||[]).length===3);

// ============ REGIONS ============
handleNav('regions');
const rg = document.getElementById('region-grid').innerHTML;
__check('regions: renders Afrika row (visible)', rg.indexOf('Afrika')>=0 && rg.indexOf('data-region-id="1"')>=0);
__check('regions: renders Sydamerika row (visible)', rg.indexOf('Sydamerika')>=0 && rg.indexOf('data-region-id="2"')>=0);
__check('regions: attribute-safe (no raw quotes)', rg.indexOf('" onclick="')<0);
__check('regions: view-regions is active', document._views.get('view-regions').classList.contains('active'));

// ============ COUNTRIES (region dossier -> country list) ============
goRegion(1);
const cg1 = document.getElementById('country-grid').innerHTML;
__check('countries: Somalia row rendered (visible)', cg1.indexOf('Somalia')>=0 && cg1.indexOf('data-country-id="61"')>=0);
__check('countries: region title set to Afrika', document.getElementById('countries-title').textContent === 'Afrika');
__check('countries: side rail lists other region (Sydamerika)', document.getElementById('region-context').innerHTML.indexOf('Sydamerika')>=0);
__check('countries: view-countries is active', document._views.get('view-countries').classList.contains('active'));
goRegion(2);
const cg2 = document.getElementById('country-grid').innerHTML;
__check('countries: Ecuador row rendered (visible)', cg2.indexOf('Ecuador')>=0 && cg2.indexOf('data-country-id="62"')>=0);

// ============ COUNTRY DOSSIER ============
goCountry(61);
__check('country: dossier name Somalia rendered', document.getElementById('country-name-static').innerHTML.indexOf('Somalia')>=0);
const tg = document.getElementById('topics-grid').innerHTML;
__check('country: topic card title rendered + ampersand escaped', tg.indexOf('Handel')>=0 && tg.indexOf('Handel &amp; hamn')>=0 && tg.indexOf('Handel & hamn')<0);
__check('country: card body visible text rendered', tg.indexOf('Mogadishu')>=0);
__check('country: card kv row rendered', tg.indexOf('Sektor')>=0);
__check('country: ngo list renders IOM Somalia (visible)', document.getElementById('ngo-list').innerHTML.indexOf('IOM Somalia')>=0);
__check('country: view-country is active', document._views.get('view-country').classList.contains('active'));
goCountry(62);
const es = document.getElementById('empty-state').innerHTML;
__check('country: empty dossier (Ecuador) shows empty message w/ name', es.indexOf('Ecuador')>=0 && es.length>0);

// ============ COUNTRY-DOSSIER EDITOR ============
editMode = true;
goCountry(61);
const tge = document.getElementById('topics-grid').innerHTML;
__check('country-edit: editing card carries data-card-id', tge.indexOf('data-card-id="601"')>=0);
__check('country-edit: add-topic-card button present', tge.indexOf('add-topic-card')>=0);
__check('country-edit: ngo rendered as edit row', document.getElementById('ngo-list').innerHTML.indexOf('data-ngo-id="611"')>=0);
__check('country-edit: dossier view stays active', document._views.get('view-country').classList.contains('active'));
editMode = false;

// ============ RESOURCES ============
handleNav('resources');
const rl = document.getElementById('resources-list').innerHTML;
__check('resources: group heading via T() rendered (ampersand escaped)', rl.indexOf('jobbs')>=0 && rl.indexOf('&amp;')>=0 && rl.indexOf('Språk')>=0);
__check('resources: resource link DeepL rendered (visible)', rl.indexOf('DeepL')>=0 && rl.indexOf('https://www.deepl.com/')>=0);
__check('resources: view-resources is active', document._views.get('view-resources').classList.contains('active'));

// ============ ABOUT ============
handleNav('about');
const od = document.getElementById('org-directory-list').innerHTML;
__check('about: org name Migrationsverket rendered', od.indexOf('Migrationsverket')>=0);
__check('about: safe org link emitted', od.indexOf('href="https://migrationsverket.se/"')>=0);
__check('about: view-about is active', document._views.get('view-about').classList.contains('active'));

// ============ NAVIGATION: resolve every data-nav token (no dead links) ============
state.regionId = 1; state.countryId = 61;
handleNav('start');
__check('nav: start -> home active', document._views.get('view-home').classList.contains('active'));
handleNav('continue');
__check('nav: continue -> country dossier', document._views.get('view-country').classList.contains('active') && state.countryId===61);
handleNav('back-to-countries');
__check('nav: back-to-countries -> region countries', document._views.get('view-countries').classList.contains('active') && state.regionId===1);
handleNav('region:2');
__check('nav: region:2 -> Sydamerika countries', document._views.get('view-countries').classList.contains('active') && state.regionId===2);
handleNav('resources');
__check('nav: resources resolves', document._views.get('view-resources').classList.contains('active'));
handleNav('about');
__check('nav: about resolves', document._views.get('view-about').classList.contains('active'));
let threw = false; try { handleNav(''); } catch(e){ threw = true; }
__check('nav: empty token is a no-op (no crash)', !threw);

// ============ i18n: per-language strings + Arabic RTL dir ============
__check('i18n: en, es, ar strings defined', typeof STRINGS.en==='object' && typeof STRINGS.es==='object' && typeof STRINGS.ar==='object');
currentLang='en'; __check('i18n: en hero_cta used', T('hero_cta')===STRINGS.en.hero_cta);
currentLang='es'; __check('i18n: es hero_cta used', T('hero_cta')===STRINGS.es.hero_cta);
currentLang='ar'; applyStaticI18n();
__check('i18n: ar sets dir=rtl and lang=ar', document.documentElement.dir==='rtl' && document.documentElement.lang==='ar');
currentLang='sv'; applyStaticI18n();
__check('i18n: sv sets dir=ltr and lang=sv', document.documentElement.dir==='ltr' && document.documentElement.lang==='sv');

return __results;
`;

const results = await runSandbox({ inlineScript, testCode: TEST_CODE, env: buildEnv() });

// ---------- module-level source wiring / regression-guard checks ----------
const sourceChecks = [
  ['source: RTL-specific CSS rules present', /\[dir="rtl"\]/.test(html)],
  ['source: prefers-reduced-motion support present', /prefers-reduced-motion/.test(html)],
  ['source: export path uses db.export()', /db\.export\(\)/.test(inlineScript) && /btn-export/.test(inlineScript)],
  ['source: import validates before replacing db (trust boundary)', /validateImportedDb\(candidate\)/.test(inlineScript) && /db = candidate;/.test(inlineScript)],
  ['source: rich-text sanitizer wired at render time', /renderTopicCard/.test(inlineScript) && /sanitizeRichHtml/.test(inlineScript)],
  ['source: no eval or new Function added', !/eval\s*\(/i.test(inlineScript) && !/new Function/.test(inlineScript)],
  ['source: no document.write added', !/document\.write/.test(inlineScript)],
  ['source: innerHTML sinks unchanged (baseline 29)', (inlineScript.match(/innerHTML/g) || []).length === 29],
  ['source: outerHTML sinks unchanged (baseline 1)', (inlineScript.match(/outerHTML/g) || []).length === 1],
  ['source: insertAdjacentHTML unchanged (baseline 1)', (inlineScript.match(/insertAdjacentHTML/g) || []).length === 1],
];

const all = results.concat(sourceChecks.map(([n, ok]) => ({ name: n, pass: !!ok, detail: ok ? '' : 'source wiring missing' })));
const { pass, fail, failures } = summarize(all);
const runtimeCount = results.length;

console.log('=== GeoBas per-route functional verification (routes.test.mjs) ===');
console.log('runtime assertions:', runtimeCount, '| source checks:', sourceChecks.length);
console.log('PASS:', pass, ' FAIL:', fail);
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log('  - ' + f.name + (f.detail ? '  [' + f.detail + ']' : ''));
}
console.log(fail === 0 ? '\nALL ROUTE CHECKS PASSED' : '\nSOME ROUTE CHECKS FAILED');
process.exit(fail === 0 ? 0 : 1);
