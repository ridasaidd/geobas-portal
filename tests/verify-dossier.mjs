// One-off verification: render the premium country dossier (Somalia sim) and
// dump every new dossier container + the hero banner, using the REAL inline
// script from geobas-portal.html inside the same parse5 sandbox as the smoke test.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
let parse5;
try { parse5 = require('/opt/hermes/node_modules/parse5'); }
catch (e) { parse5 = require('parse5'); } // host fallback (tests/node_modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, '..', 'geobas-portal.html'), 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function makeElement(id){ return {
  id, innerHTML:'', textContent:'', value:'', _attrs:{}, hidden:false, style:{},
  classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
  addEventListener(){}, focus(){}, querySelectorAll(){ return []; },
  setAttribute(n,v){ this._attrs[n]=String(v); }, getAttribute(n){ return n in this._attrs?this._attrs[n]:null; },
  removeAttribute(n){ delete this._attrs[n]; }, appendChild(){}, remove(){},
}; }
function makeEscapeDiv(){ let t=''; return { tagName:'DIV',
  set textContent(v){ t= v==null?'':String(v); },
  get innerHTML(){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); } }; }
const documentStub = {
  _els:{},
  getElementById(id){ if(!this._els[id]) this._els[id]=makeElement(id); return this._els[id]; },
  createElement(tag){ return tag==='div'?makeEscapeDiv():makeElement(tag); },
  addEventListener(){}, querySelector(){ return makeElement('q'); }, querySelectorAll(){ return []; },
  title:'', documentElement:{ lang:'', dir:'' },
};
const localStorageStub = (()=>{ const m=new Map(); return { getItem(k){return m.has(k)?m.get(k):null;},setItem(k,v){m.set(k,String(v));},removeItem(k){m.delete(k);},clear(){m.clear();} }; })();
const windowStub = { localStorage:localStorageStub, storage:undefined, addEventListener(){}, scrollTo(){}, location:{ href:'http://localhost/' } };
const NodeConst={TEXT_NODE:3,ELEMENT_NODE:1}; const NodeFilterConst={SHOW_COMMENT:128};
function escText(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
function serializeNode(shim){ const p=shim._p5; if(shim.nodeType===3) return escText(p.value!=null?p.value:p.nodeValue);
  if(shim.nodeType===8) return '<!--'+((p.data!=null?p.data:(p.nodeValue!=null?p.nodeValue:'')))+'-->';
  const tag=(p.tagName||'').toLowerCase(); if(tag==='br') return '<br>';
  let s='<'+tag; for(const a of (p.attrs||[])) s+=' '+a.name+'="'+escAttr(a.value)+'"';
  s+='>'+shim.childNodes.map(serializeNode).join('')+'</'+tag+'>'; return s; }
function serializeChildren(shim){ return shim.childNodes.map(serializeNode).join(''); }
function collectText(shim){ let s=''; const walk=n=>{ for(const c of n.childNodes){ if(c.nodeType===3) s+=c._p5.value!=null?c._p5.value:c._p5.nodeValue; else walk(c); } }; walk(shim); return s; }
class ShimNode{ constructor(p5n,parent){ this._p5=p5n; this.parentNode=parent||null; this.childNodes=(p5n.childNodes||[]).map(c=>new ShimNode(c,this)); }
  get nodeType(){ const n=this._p5.nodeName; if(n==='#text')return 3; if(n==='#comment')return 8; if(n==='#document')return 9; return 1; }
  get tagName(){ return (this._p5.tagName||this._p5.nodeName||'').toUpperCase(); } get firstChild(){ return this.childNodes[0]||null; }
  get attributes(){ return this._p5.attrs||[]; }
  getAttribute(n){ const a=(this._p5.attrs||[]).find(x=>x.name.toLowerCase()===String(n).toLowerCase()); return a?a.value:null; }
  setAttribute(n,v){ const arr=this._p5.attrs||(this._p5.attrs=[]); const i=arr.findIndex(x=>x.name===n); if(i>=0)arr[i].value=String(v); else arr.push({name:n,value:String(v)}); }
  removeAttribute(n){ if(this._p5.attrs){ const i=this._p5.attrs.findIndex(x=>x.name===n); if(i>=0)this._p5.attrs.splice(i,1); } }
  get textContent(){ return collectText(this); } get innerHTML(){ return serializeChildren(this); } get outerHTML(){ return serializeNode(this); }
  remove(){ if(this.parentNode){ const arr=this.parentNode.childNodes,i=arr.indexOf(this); if(i>=0)arr.splice(i,1); this.parentNode=null; } }
  insertBefore(nn,ref){ if(nn.parentNode){const oi=nn.parentNode.childNodes.indexOf(nn); if(oi>=0)nn.parentNode.childNodes.splice(oi,1);} nn.parentNode=this; const arr=this.childNodes,i=ref?arr.indexOf(ref):-1; if(i>=0)arr.splice(i,0,nn); else arr.push(nn); }
  querySelectorAll(sel){ const want=sel.split(',').map(s=>s.trim().toLowerCase()); const out=[]; const walk=n=>{ for(const c of n.childNodes){ if(c.nodeType===1){ if(want.includes('*')||want.includes(c.tagName.toLowerCase()))out.push(c); walk(c); } } }; walk(this); return out; }
  getElementById(id){ let found=null; const walk=n=>{ for(const c of n.childNodes){ if(c.nodeType===1){ if(c.getAttribute('id')===id){found=c;return;} walk(c); if(found)return; } } }; walk(this); return found; }
  createTreeWalker(root){ const comments=[]; const walk=n=>{ for(const c of n.childNodes){ if(c.nodeType===8)comments.push(c); walk(c); } }; walk(root); let i=-1; return { currentNode:null, nextNode(){ i++; if(i<comments.length){this.currentNode=comments[i];return true;} return false; } }; }
  get body(){ return this.querySelectorAll('body')[0]||null; } }
class DOMParserShim{ parseFromString(str){ return new ShimNode(parse5.parse(String(str)), null); } }

const PROBE = `
const __out = [];
const regions = [{id:9, slug:'afrika', name:'Afrika', translated:true, countryCount:7}];
getRegions = () => regions;
getCountriesForRegion = (rid, lang) => [
  { id:100, name:'Somalia', translated:true, hasContent:true },
  { id:102, name:'Kenya', translated:true, hasContent:true },
];
getCountryDetail = (cid, lang) => ({
  name:'Somalia', intro:'Somalia är ett land i Östafrika med en lång kustlinje mot Indiska oceanen.',
  translated:true,
  cards:[
    { id:910, title:'Rese- och inresekrav', body:['<p>Dokument och inreseinformation.</p>'], kv:[{k:'Huvudstad',v:'Mogadishu'},{k:'Språk',v:'Somaliska, arabiska'}] },
    { id:911, title:'Säkerhetsläge', body:['<p>Säkerhetsläget varierar.</p>'], kv:[] },
    { id:912, title:'Boende och mottagning', body:['<p>Stöd vid ankomst.</p>'], kv:[{k:'Tidszon',v:'EAT (UTC+3)'}] },
    { id:913, title:'Ekonomi och arbete', body:['<p>Arbetsvägar.</p>'], kv:[] },
  ],
});
getNgos = () => [{ id:31, name:'IOM', url:'https://iom.int/', note:'Betalar ut återetableringsstöd.' }];
getRegionById = (id) => regions[0];
findRegionForCountry = () => regions[0];
q = (sql, params) => { const id = params ? params[0] : null; if(/SELECT slug FROM countries/.test(sql)){ return id===100?[{slug:'somalia'}]: (id===102?[{slug:'kenya'}]:[]); } return []; };
currentLang='sv'; editMode=false;
await initDatabase();
goCountry(100);
__out.push({label:'hero-bg', v: document.getElementById('dossier-hero').style.backgroundImage});
__out.push({label:'hero-credit', v: document.getElementById('country-hero-credit').textContent});
__out.push({label:'hero-flag', v: document.getElementById('country-flag').src + '|hidden=' + document.getElementById('country-flag').hidden});
__out.push({label:'overview', v: document.getElementById('dossier-overview').innerHTML});
__out.push({label:'facts', v: document.getElementById('dossier-facts').innerHTML});
__out.push({label:'related', v: document.getElementById('dossier-related').innerHTML});
__out.push({label:'topics', v: document.getElementById('topics-grid').innerHTML});
// switch to the security tab and show the filtered topics
setDossierTab('security');
__out.push({label:'security-topics', v: document.getElementById('topics-grid').innerHTML});
__out.push({label:'security-sections-hidden', v: (document.getElementById('dossier-facts').style.display)});
// orgs tab
setDossierTab('orgs');
__out.push({label:'orgs-side', v: document.getElementById('ngo-list').innerHTML});
return __out;
`;
const sandbox = new Function('document','window','DOMParser','NodeFilter','Node','Globe','initSqlJs',
  'return (async () => {\n'+inlineScript+'\n'+PROBE+'\n})();');
const initSqlJsStub = async () => ({ Database: class { constructor(bytes){ this.bytes=bytes||null; } run(){} exec(sql){ if(/last_insert_rowid/i.test(sql))return [{columns:['id'],values:[[1]]}]; return []; } export(){ return new Uint8Array([1,2,3,4]); } prepare(){ return { bind(){}, step(){ return false; }, getAsObject(){ return {}; }, free(){} }; } } });

try {
  const out = await sandbox(documentStub, windowStub, DOMParserShim, NodeFilterConst, NodeConst, undefined, initSqlJsStub);
  for (const o of out) { console.log('\n======== '+o.label+' ========\n' + o.v); }
  console.log('\nVERIFY COMPLETE');
} catch (e) { console.error('VERIFY CRASH:', e && e.stack ? e.stack : e); process.exit(1); }
