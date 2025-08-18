/** =========================================================
 *  SINGLE-FILE WEB APP with API Pull + Private Viewers
 *  Views: 'all' (Founders+Laura+Damon), 'laura', 'damon'
 *  Profit rule: P = Total Value − Net Principal
 *  Carry: applied per segment from Laura & Damon to Founders
 * ========================================================= */

/** -------- SHEET CONFIG (leave SHEET_ID empty if bound) -------- */
const SHEET_ID = '';  // paste a Sheet ID only if this project is standalone

// Named ranges (preferred) and their fallback A1 cells on "Settings"
const RANGE_TOTAL_VALUE   = 'TOTAL_VALUE';
const RANGE_NET_PRINCIPAL = 'NET_PRINCIPAL';
const RANGE_TOTAL_PROFIT  = 'TOTAL_PROFIT';
const RANGE_CARRY_RATE    = 'CARRY_RATE';
const A1_TOTAL_VALUE      = 'Settings!B6';
const A1_NET_PRINCIPAL    = 'Settings!B7';
const A1_TOTAL_PROFIT     = 'Settings!B8';
const A1_CARRY_RATE       = 'Settings!B9';

/** -------- VIEW PRIVACY (map emails → view) --------
 * Example:
 *   'laura@gmail.com': 'laura',
 *   'damon@gmail.com': 'damon',
 *   'you@yourmail.com': 'all'
 * If left empty, you can still force views with ?view=laura|damon|all
 */
const VIEWER_ROLES = {
  // 'laura@example.com': 'laura',
  // 'damon@example.com': 'damon',
  // 'you@example.com':   'all'
};

/** -------- API CONFIG (edit these to your source) --------
 * Pulls Total Value from a JSON API or HTML page and saves to the Sheet.
 * Then TOTAL_PROFIT is recomputed as TV − NetPrincipal.
 *
 * Examples:
 *  1) JSON:
 *     API_MODE = 'JSON';
 *     API_URL = 'https://api.example.com/v1/portfolio';
 *     API_JSON_PATH = 'portfolio.totalValue';
 *  2) HTML:
 *     API_MODE = 'HTML';
 *     API_URL = 'https://example.com/dashboard';
 *     API_REGEX = 'Total\\s*Value\\s*[:\\s]*([$€£]?\\s*[-+()0-9.,kKmM]+)';
 *     API_GROUP = 1;
 */
let API_ENABLED   = false;                        // turn ON after you set URL/path/regex
let API_MODE      = 'JSON';                       // 'JSON' or 'HTML'
let API_URL       = 'https://api.example.com/v1/portfolio';  // <— change me when ready
let API_JSON_PATH = 'portfolio.totalValue';                  // <— change me if JSON
let API_REGEX     = 'Total\\s*Value\\s*[:\\s]*([$€£]?\\s*[-+()0-9.,kKmM]+)'; // <— change me if HTML
let API_GROUP     = 1;
// Optional headers (e.g., bearer token). Keep this object empty if not needed.
let API_HEADERS   = { /* 'Authorization': 'Bearer YOUR_TOKEN' */ };

/** ==================== App bootstrap & menu ==================== */
function _openSheet_(){ return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActive(); }
function _rng_(name, a1){ const ss=_openSheet_(); return ss.getRangeByName(name) || ss.getRange(a1); }
function _readNum_(name, a1, def){ const n = Number(_rng_(name,a1).getValue()); return isFinite(n) ? n : def; }
function _writeNum_(name, a1, val){ _rng_(name,a1).setValue(val); }

function onOpen(){
  SpreadsheetApp.getUi()
    .createMenu('ROI Model')
    .addItem('Create/Update Settings sheet', 'createOrUpdateSettingsSheet')
    .addItem('Open All-Parties (Sidebar)', 'openAllSidebar')
    .addItem('Pull Total Value from API now', 'refreshFromAPI')
    .addItem('Auto-refresh from API (15 min)', 'createAutoRefresh')
    .addItem('Stop Auto-refresh', 'deleteAutoRefresh')
    .addToUi();
}

function createOrUpdateSettingsSheet(){
  const ss = _openSheet_();
  const sh = ss.getSheetByName('Settings') || ss.insertSheet('Settings');
  sh.getRange('A6').setValue('Total Value');     if (!sh.getRange('B6').getValue()) sh.getRange('B6').setValue(24113);
  sh.getRange('A7').setValue('Net Principal');   if (!sh.getRange('B7').getValue()) sh.getRange('B7').setValue(20000);
  sh.getRange('A8').setValue('Total Profit (TV − NP)');
  sh.getRange('A9').setValue('Carry % (default)'); if (!sh.getRange('B9').getValue()) sh.getRange('B9').setValue(20);
  const tv = _readNum_(RANGE_TOTAL_VALUE, A1_TOTAL_VALUE, 24113);
  const np = _readNum_(RANGE_NET_PRINCIPAL, A1_NET_PRINCIPAL, 20000);
  _writeNum_(RANGE_TOTAL_PROFIT, A1_TOTAL_PROFIT, tv - np);
  SpreadsheetApp.getUi().alert('Settings sheet is ready.\nEdit B6 (Total Value) and B7 (Net Principal).');
}

function openAllSidebar(){
  const html = _buildHtml_('all', getDefaults());
  SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutput(html).setTitle('All-Parties Viewer'));
}

/** ==================== Web App entry ==================== */
function doGet(e){
  const view = _resolveView_(e);
  const html = _buildHtml_(view, getDefaults());
  return HtmlService.createHtmlOutput(html)
    .setTitle(view==='all' ? 'Profit Split — All Parties' : 'Private Viewer')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function _resolveView_(e){
  const email = (Session.getActiveUser() && Session.getActiveUser().getEmail()) || '';
  if (email && VIEWER_ROLES[email]) return VIEWER_ROLES[email];
  const v = e && e.parameter && String(e.parameter.view||'').toLowerCase();
  return (v==='laura'||v==='damon'||v==='all') ? v : 'all';
}

function getDefaults(){
  return {
    totalValue:   _readNum_(RANGE_TOTAL_VALUE,   A1_TOTAL_VALUE,   24113),
    netPrincipal: _readNum_(RANGE_NET_PRINCIPAL, A1_NET_PRINCIPAL, 20000),
    carry:        _readNum_(RANGE_CARRY_RATE,    A1_CARRY_RATE,    20)
  };
}

function saveSettings(payload){
  const tv = Number(payload.totalValue||0);
  const np = Number(payload.netPrincipal||0);
  const cr = Number(payload.carry||0);
  const profit = tv - np;
  _writeNum_(RANGE_TOTAL_VALUE,   A1_TOTAL_VALUE,   tv);
  _writeNum_(RANGE_NET_PRINCIPAL, A1_NET_PRINCIPAL, np);
  _writeNum_(RANGE_TOTAL_PROFIT,  A1_TOTAL_PROFIT,  profit);
  _writeNum_(RANGE_CARRY_RATE,    A1_CARRY_RATE,    cr);
  return { ok:true, totalValue:tv, netPrincipal:np, profit, carry:cr };
}

/** ==================== API pull (server) ==================== */
function refreshFromAPI(){
  if (!API_ENABLED) throw new Error('API pull is disabled. Set API_ENABLED=true after configuring API_URL & JSON path/HTML regex.');
  const tv = _pullTotalValue_();                    // fetch Total Value
  const np = _readNum_(RANGE_NET_PRINCIPAL, A1_NET_PRINCIPAL, 20000);
  const profit = tv - np;
  _writeNum_(RANGE_TOTAL_VALUE,  A1_TOTAL_VALUE,  tv);
  _writeNum_(RANGE_TOTAL_PROFIT, A1_TOTAL_PROFIT, profit);
  const ss = _openSheet_();
  const log = ss.getSheetByName('Web Feed Log') || ss.insertSheet('Web Feed Log');
  if (log.getLastRow() === 0) log.appendRow(['Timestamp','Source','TotalValue','NetPrincipal','Profit','Mode']);
  log.appendRow([new Date(), API_URL, tv, np, profit, API_MODE]);
  return { ok:true, totalValue:tv, netPrincipal:np, profit };
}
function createAutoRefresh(){ deleteAutoRefresh(); ScriptApp.newTrigger('refreshFromAPI').timeBased().everyMinutes(15).create(); return {ok:true}; }
function deleteAutoRefresh(){ ScriptApp.getProjectTriggers().forEach(t=>{ if (t.getHandlerFunction()==='refreshFromAPI') ScriptApp.deleteTrigger(t); }); return {ok:true}; }

function _pullTotalValue_(){
  const opts = { muteHttpExceptions:true };
  if (API_HEADERS && Object.keys(API_HEADERS).length) opts.headers = API_HEADERS;
  const resp = UrlFetchApp.fetch(API_URL, opts);
  const body = resp.getContentText();
  if (resp.getResponseCode() >= 400 || !body) throw new Error('API HTTP ' + resp.getResponseCode());
  if (API_MODE === 'JSON'){
    const obj = JSON.parse(body); const raw = _dig_(obj, API_JSON_PATH); const num = _toNumber_(raw);
    if (num == null) throw new Error('JSON path not numeric: ' + API_JSON_PATH); return num;
  } else {
    const re = new RegExp(API_REGEX, 'i'); const m = body.match(re);
    if (!m || m.length <= (API_GROUP||1)) throw new Error('Regex did not match: ' + API_REGEX);
    const num = _toNumber_(m[API_GROUP||1]); if (num == null) throw new Error('Regex group not numeric'); return num;
  }
}
function _dig_(obj, path){ return String(path||'').split('.').reduce((o,k)=> (o && (k in o)) ? o[k] : null, obj); }
function _toNumber_(s){
  if (s==null) return null; s = String(s).trim();
  let neg=false; if (/\(.*\)/.test(s)) { neg=true; s=s.replace(/[()]/g,''); }
  let mult=1; if (/[kK]\b/.test(s)) { mult=1e3; s=s.replace(/[kK]\b/,''); } if (/[mM]\b/.test(s)) { mult=1e6; s=s.replace(/[mM]\b/,''); }
  if (/,/.test(s) && /\d,\d{2}$/.test(s) && !/\.\d{2}$/.test(s)) s = s.replace(/\./g,'').replace(',', '.');
  s = s.replace(/[^0-9.\-]/g, ''); const n = Number(s); if (!isFinite(n)) return null; return (neg ? -n : n) * mult;
}

/** ==================== HTML builder (both views) ==================== */
function _buildHtml_(view, defaults){
  const tv  = Number(defaults.totalValue||0);
  const np  = Number(defaults.netPrincipal||0);
  const cr  = Number(defaults.carry||20);
  const party = view==='laura' ? 'L' : view==='damon' ? 'D' : 'ALL';
  const partyLabel = view==='laura' ? 'Laura' : view==='damon' ? 'Damon' : 'All Parties';

  // Inline CSS kept compact; UI intentionally minimal to avoid paste issues.
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Profit Split — ${party==='ALL' ? 'All Parties' : 'Private — ' + partyLabel}</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
:root{--bar-h:26px;--gap:10px;--font:14px}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:14px}
h1{font-size:18px;margin:8px 0}.muted{color:#666}.controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:var(--gap);margin:10px 0 14px;align-items:end}
.control{display:flex;flex-direction:column}label{font-size:var(--font);margin-bottom:6px}input[type="number"]{padding:8px;font-size:var(--font)}
button{padding:8px 12px;cursor:pointer}.btnrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.bars{display:grid;gap:10px;margin-top:8px}.bar-row{display:grid;grid-template-columns:190px 1fr 150px;align-items:center;gap:10px}
.bar-label{font-weight:600}.bar-track{height:var(--bar-h);background:#eee;border-radius:6px;overflow:hidden}
.bar-fill{height:100%}.founders{background:#cfead9}.laura{background:#fde5b8}.damon{background:#d8e3ff}.bar-value{text-align:right;font-variant-numeric:tabular-nums}
.hide{display:none!important}table{border-collapse:collapse;margin-top:10px;width:100%}th,td{border:1px solid #ddd;padding:6px;text-align:right}th:first-child,td:first-child{text-align:left}
</style></head><body>
<h1>${party==='ALL' ? 'Profit Split — Founders · Laura · Damon' : 'Private Viewer — ${partyLabel}'}</h1>
<div class="muted">Timeline: Founders $5k (Jul 10) → +Laura $5k (Jul 22) → +Laura $5k (Jul 31) → +Damon $5k (Aug 2). Profit P = Total Value − Net Principal. Carry (default 20%) moves from Laura & Damon to Founders per segment. (Matches our earlier interactive.)</div>

<div class="controls">
  <div class="control"><label for="tvInput">Total Value</label><input id="tvInput" type="number" step="1" min="0" value="${tv}"></div>
  <div class="control"><label for="npInput">Net Principal</label><input id="npInput" type="number" step="1" min="0" value="${np}"></div>
  <div class="control"><label for="carryInput">Carry (%)</label><input id="carryInput" type="number" step="1" min="0" max="100" value="${cr}"></div>
  <div class="control"><label>&nbsp;</label><div class="btnrow">
    <button id="btnRecalc" type="button">Recalculate</button>
    <button id="btnLoad" type="button">Load</button>
    <button id="btnSave" type="button">Save</button>
    <button id="btnCsv"  type="button">CSV</button>
    <button id="btnApi"  type="button">Refresh API</button>
  </div></div>
</div>

<div class="muted">Computed Profit (P) → <span id="profitEcho"><b>$0.00</b></span></div>

<!-- ALL-PARTIES -->
<div id="allApp" class="${party==='ALL' ? '' : 'hide'}">
  <div class="bars" id="bars"></div>
  <table id="audit"><thead><tr>
    <th>Seg</th><th>Dates</th><th>Days</th><th>Pot</th><th>Cap-Days</th>
    <th>Profit(seg)</th><th>Pre-F</th><th>Pre-L</th><th>Pre-D</th>
    <th>Carry→F</th><th>Post-F</th><th>Post-L</th><th>Post-D</th>
  </tr></thead><tbody></tbody><tfoot><tr>
    <th colspan="4">Totals</th><th id="totCD"></th><th id="totP"></th>
    <th id="totPreF"></th><th id="totPreL"></th><th id="totPreD"></th>
    <th id="totCarry"></th><th id="totPostF"></th><th id="totPostL"></th><th id="totPostD"></th>
  </tr></tfoot></table>
</div>

<!-- PRIVATE -->
<div id="privApp" class="${party==='ALL' ? 'hide' : ''}">
  <div class="bar-row"><div class="bar-label"><b>${partyLabel} — Total After Carry</b></div><div class="bar-track"><div class="bar-fill laura" id="privFill" style="width:100%"></div></div><div class="bar-value" id="privVal">$0.00</div></div>
  <table id="privTable"><thead><tr>
    <th>Seg</th><th>Dates</th><th>Days</th><th>Pot</th><th>Your %</th><th>Profit(seg)</th><th>Your Pre</th><th>Carry</th><th>Your After</th>
  </tr></thead><tbody></tbody><tfoot><tr>
    <th colspan="5">Totals</th><th id="pTotSeg"></th><th id="pTotPre"></th><th id="pTotCarry"></th><th id="pTotAfter"></th>
  </tr></tfoot></table>
</div>

<script>
const INITIAL = { party:'${party}', partyLabel:'${partyLabel}' };

// Segments from your schedule (cap-days)
const segments = [
  { name:'S1', dates:'Jul 10 → Jul 22', days:12, pot: 5000, parts:{F:5000,L:   0,D:   0} },
  { name:'S2', dates:'Jul 22 → Jul 31', days: 9, pot:10000, parts:{F:5000,L:5000,D:   0} },
  { name:'S3', dates:'Jul 31 → Aug 2',  days: 2, pot:15000, parts:{F:5000,L:10000,D:  0} },
  { name:'S4', dates:'Aug 2 → Aug 13',  days:11, pot:20000, parts:{F:5000,L:10000,D:5000} }
];

const $ = id=>document.getElementById(id);
const fmt = n=>'$'+n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function computeAll(P,cPct){
  const c=(cPct||0)/100, totalCD=segments.reduce((s,x)=>s+x.pot*x.days,0);
  let rows=[], preF=0,preL=0,preD=0, totCarry=0, postF=0,postL=0,postD=0;
  for(const s of segments){
    const segP=P*(s.pot*s.days)/totalCD, shareF=s.parts.F/s.pot, shareL=s.parts.L/s.pot, shareD=s.parts.D/s.pot;
    const f0=segP*shareF, l0=segP*shareL, d0=segP*shareD, carry=c*(l0+d0);
    const f1=f0+carry, l1=l0*(1-c), d1=d0*(1-c);
    rows.push({seg:s.name,dates:s.dates,days:s.days,pot:s.pot,cd:s.pot*s.days,segP,preF:f0,preL:l0,preD:d0,carry,postF:f1,postL:l1,postD:d1});
    preF+=f0; preL+=l0; preD+=d0; totCarry+=carry; postF+=f1; postL+=l1; postD+=d1;
  }
  return {rows, totals:{preF,preL,preD,totCarry,postF,postL,postD}};
}
function computePriv(P,cPct,party){ const c=(cPct||0)/100, totalCD=segments.reduce((s,x)=>s+x.pot*x.days,0);
  let rows=[], totSeg=0,totPre=0,totCarry=0,totAfter=0;
  for(const s of segments){ const segP=P*(s.pot*s.days)/totalCD, share=(s.parts[party]||0)/s.pot;
    const pre=segP*share, carry=pre*c, after=pre-carry;
    rows.push({seg:s.name,dates:s.dates,days:s.days,pot:s.pot,pct:share*100,segP,pre,carry,after});
    totSeg+=segP; totPre+=pre; totCarry+=carry; totAfter+=after;
  } return {rows, totals:{totSeg,totPre,totCarry,totAfter}};
}

function render(){
  const tv = Math.max(0, Number($('tvInput').value||0));
  const np = Math.max(0, Number($('npInput').value||0));
  const P  = tv - np;
  const c  = Math.min(100, Math.max(0, Number($('carryInput').value||0)));
  $('profitEcho').innerHTML='<b>'+fmt(P)+'</b>';

  if(INITIAL.party==='ALL'){
    const {rows, totals}=computeAll(P,c), totalAfter=totals.postF+totals.postL+totals.postD;
    const bars=$('bars'); bars.innerHTML='';
    [{label:'Founders (Yoni+Spence)',value:totals.postF,cls:'founders'},
     {label:'Laura',value:totals.postL,cls:'laura'},
     {label:'Damon',value:totals.postD,cls:'damon'}].forEach(r=>{
       const row=document.createElement('div'); row.className='bar-row';
       row.innerHTML='<div class="bar-label">'+r.label+'</div><div class="bar-track"><div class="bar-fill '+r.cls+'" style="width:'+(totalAfter?(r.value/totalAfter*100).toFixed(4):0)+'%"></div></div><div class="bar-value">'+fmt(r.value)+'</div>';
       bars.appendChild(row);
     });
    const tbody=document.querySelector('#audit tbody'); tbody.innerHTML='';
    rows.forEach(r=>{ const tr=document.createElement('tr');
      tr.innerHTML='<td>'+r.seg+'</td><td style="text-align:left">'+r.dates+'</td><td>'+r.days+'</td><td>'+fmt(r.pot)+'</td><td>'+r.cd.toLocaleString()+'</td><td>'+fmt(r.segP)+'</td><td>'+fmt(r.preF)+'</td><td>'+fmt(r.preL)+'</td><td>'+fmt(r.preD)+'</td><td>'+fmt(r.carry)+'</td><td>'+fmt(r.postF)+'</td><td>'+fmt(r.postL)+'</td><td>'+fmt(r.postD)+'</td>';
      tbody.appendChild(tr);
    });
    $('totCD').textContent=rows.reduce((s,r)=>s+r.cd,0).toLocaleString();
    $('totP').textContent=fmt(rows.reduce((s,r)=>s+r.segP,0));
    $('totPreF').textContent=fmt(totals.preF); $('totPreL').textContent=fmt(totals.preL); $('totPreD').textContent=fmt(totals.preD);
    $('totCarry').textContent=fmt(totals.totCarry);
    $('totPostF').textContent=fmt(totals.postF); $('totPostL').textContent=fmt(totals.postL); $('totPostD').textContent=fmt(totals.postD);
  } else {
    const PARTY = INITIAL.party; // 'L' or 'D'
    const {rows, totals}=computePriv(P,c,PARTY);
    $('privVal').textContent=fmt(totals.totAfter);
    const tbody=document.querySelector('#privTable tbody'); tbody.innerHTML='';
    rows.forEach(r=>{ const tr=document.createElement('tr');
      tr.innerHTML='<td>'+r.seg+'</td><td style="text-align:left">'+r.dates+'</td><td>'+r.days+'</td><td>'+fmt(r.pot)+'</td><td>'+r.pct.toFixed(2)+'%</td><td>'+fmt(r.segP)+'</td><td>'+fmt(r.pre)+'</td><td>'+fmt(r.carry)+'</td><td>'+fmt(r.after)+'</td>';
      tbody.appendChild(tr);
    });
    $('pTotSeg').textContent=fmt(totals.totSeg); $('pTotPre').textContent=fmt(totals.totPre); $('pTotCarry').textContent=fmt(totals.totCarry); $('pTotAfter').textContent=fmt(totals.totAfter);
  }
}

function toCsv(){
  const tv=Number($('tvInput').value||0), np=Number($('npInput').value||0), P=tv-np, c=Number($('carryInput').value||0);
  if(INITIAL.party==='ALL'){
    const {rows, totals}=computeAll(P,c);
    const out=[]; out.push(['Inputs','','TotalValue','NetPrincipal','Profit','Carry_%'].join(',')); out.push(['','',tv,np,P,c].join(',')); out.push([]);
    out.push(['Totals After Carry','','Founders','Laura','Damon'].join(',')); out.push(['','',totals.postF.toFixed(2),totals.postL.toFixed(2),totals.postD.toFixed(2)].join(',')); out.push([]);
    out.push(['Segment','Dates','Days','Pot','CapDays','Profit','PreF','PreL','PreD','CarryMoved','PostF','PostL','PostD'].join(','));
    rows.forEach(r=> out.push([r.seg,r.dates,r.days,r.pot,r.cd,r.segP.toFixed(2),r.preF.toFixed(2),r.preL.toFixed(2),r.preD.toFixed(2),r.carry.toFixed(2),r.postF.toFixed(2),r.postL.toFixed(2),r.postD.toFixed(2)].join(',')));
    const url = URL.createObjectURL(new Blob([out.join('\n')],{type:'text/csv'})); const a=document.createElement('a'); a.href=url; a.download='profit_all.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),800);
  } else {
    const PARTY=INITIAL.party; const {rows, totals}=computePriv(P,c,PARTY);
    const out=[]; out.push(['Viewer',INITIAL.partyLabel||'Private'].join(',')); out.push(['Inputs','TotalValue','NetPrincipal','Profit','Carry_%'].join(',')); out.push(['',tv,np,P,c].join(',')); out.push([]);
    out.push(['Seg','Dates','Days','Pot','Your_%','Profit(seg)','Your_Pre','Carry_Deducted','Your_After'].join(','));
    rows.forEach(r=> out.push([r.seg,r.dates,r.days,r.pot,r.pct.toFixed(2)+'%',r.segP.toFixed(2),r.pre.toFixed(2),r.carry.toFixed(2),r.after.toFixed(2)].join(',')));
    out.push([]); out.push(['Totals','','','','',totals.totSeg.toFixed(2),totals.totPre.toFixed(2),totals.totCarry.toFixed(2),totals.totAfter.toFixed(2)].join(','));
    const url=URL.createObjectURL(new Blob([out.join('\n')],{type:'text/csv'})); const a=document.createElement('a'); a.href=url; a.download='profit_private.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),800);
  }
}

// Wire buttons after DOM loads
document.addEventListener('DOMContentLoaded', ()=>{
  const ids=['tvInput','npInput','carryInput']; ids.forEach(id=>document.getElementById(id).addEventListener('input',render));
  document.getElementById('btnRecalc').addEventListener('click',render);
  document.getElementById('btnCsv').addEventListener('click',toCsv);
  document.getElementById('btnLoad').addEventListener('click',()=>{ google.script.run.withSuccessHandler(({totalValue,netPrincipal,carry})=>{
    $('tvInput').value=totalValue??0; $('npInput').value=netPrincipal??20000; $('carryInput').value=(typeof carry==='number'?carry:20); render();
  }).getDefaults(); });
  document.getElementById('btnSave').addEventListener('click',()=>{ const payload={ totalValue:Number($('tvInput').value||0), netPrincipal:Number($('npInput').value||0), carry:Number($('carryInput').value||0) };
    google.script.run.withSuccessHandler(res=>{ $('tvInput').value=res.totalValue; $('npInput').value=res.netPrincipal; $('carryInput').value=res.carry; render(); alert('Saved. TOTAL_PROFIT = '+res.profit.toLocaleString()); }).saveSettings(payload);
  });
  document.getElementById('btnApi').addEventListener('click',()=>{ google.script.run.withSuccessHandler(res=>{ $('tvInput').value=res.totalValue; $('npInput').value=res.netPrincipal; render(); alert('API refreshed. TOTAL_PROFIT = '+res.profit.toLocaleString()); }).withFailureHandler(err=>alert('API refresh failed: '+(err&&err.message?err.message:err))).refreshFromAPI(); });
  render();
});
</script></body></html>`;
  return html;
}

// End of file

