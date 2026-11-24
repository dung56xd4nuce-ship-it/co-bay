// Đo khung hình như người chơi trên máy thật: màn dọc 400x869 @3x (giống video), CPU chậm 4 lần, Quần Hùng.
// In ra phân bố khoảng cách khung hình và các khung tệ nhất kèm "ai làm chậm".
// Dùng: node test/_prof.mjs [url] [--land] [--cpu=4] [--sec=40] [--seed=61]
import { chromium } from 'playwright';
const arg=(k,d)=>{ const a=process.argv.find(x=>x.startsWith('--'+k+'=')); return a? a.split('=')[1] : d; };
const URL=process.argv.find(a=>a.startsWith('http'))||'http://localhost:8766/index.html';
const land=process.argv.includes('--land'), cpu=+arg('cpu',4), SEC=+arg('sec',40), seed=+arg('seed',61), dsf=+arg('dsf',3);
const vp= land? {width:869,height:400} : {width:400,height:869};
const b=await chromium.launch(); const ctx=await b.newContext({viewport:vp,deviceScaleFactor:dsf,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu')); await p.waitForTimeout(600);
const cdp=await ctx.newCDPSession(p);
await p.evaluate((seed)=>{ G.bwCfg={royale:36,seed,civ:'vn'}; startBigWar(5); __ltm.bw.intro=null; },seed);
await p.waitForTimeout(2500);
await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
await p.evaluate(()=>{ const P=BigWar.prototype; const S=window.__pf={fr:[],cur:null,last:0,mark:''};
  const wrap=(name,key)=>{ const f=P[name]; if(!f) return; P[name]=function(){ const t0=performance.now(); try{ return f.apply(this,arguments); } finally{ if(S.cur){ S.cur[key]=(S.cur[key]||0)+performance.now()-t0; S.cur['n_'+key]=(S.cur['n_'+key]||0)+1; } } }; };
  wrap('update','upd'); wrap('draw','draw'); wrap('drawMap','map'); wrap('findPath','path'); wrap('aiTurn','ai'); wrap('supplyTick','sup'); wrap('drawFog','fog'); wrap('drawHud','hud'); wrap('_updateVision','vis'); wrap('aiDiplomacy','dip'); wrap('drawNode','node'); wrap('drawArmy','army'); wrap('drawPaths','paths'); wrap('saveState','save');
  const of=window.frame; window.frame=function(now){ const t0=performance.now(); S.cur={}; const cv=document.getElementById('game'); const w0=cv.width;
    of(now); const c=S.cur; S.cur=null; c.js=performance.now()-t0; c.gap=S.last? now-S.last : 0; S.last=now; c.mk=S.mark; c.cw=cv.width; if(cv.width!==w0) c.resize=1; c.t=now; S.fr.push(c); }; });
const mark=(m)=>p.evaluate((m)=>{ __pf.mark=m; },m);
const W=vp.width, H=vp.height;
const drag=async(x0,y0,x1,y1,steps=24,dt=16)=>{ await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:y0,id:1}]});
  for(let i=1;i<=steps;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+(x1-x0)*i/steps,y:y0+(y1-y0)*i/steps,id:1}]}); await p.waitForTimeout(dt); }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); };
const pinch=async(cx,cy,d0,d1,steps=20)=>{ const pts=(d)=>[{x:cx-d/2,y:cy,id:1},{x:cx+d/2,y:cy,id:2}]; await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts(d0)});
  for(let i=1;i<=steps;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts(d0+(d1-d0)*i/steps)}); await p.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); };
const t0=Date.now(); const left=()=>SEC*1000-(Date.now()-t0);
await mark('idle'); await p.waitForTimeout(Math.min(6000,SEC*150));
// phóng to như trong video (scale ~0.2 → zoom ~1.6-2)
await mark('zoom'); await pinch(W/2,H/2,90,260); await p.waitForTimeout(900);
let k=0;
while(left()>9000){ await mark('pan'); const dir=k++%4; const a=[[W*0.75,H*0.6,W*0.2,H*0.45],[W*0.25,H*0.45,W*0.8,H*0.6],[W*0.5,H*0.75,W*0.45,H*0.3],[W*0.5,H*0.3,W*0.55,H*0.75]][dir];
  await drag(...a,22,16); await mark('rest'); await p.waitForTimeout(700); }
await mark('zoomout'); await pinch(W/2,H/2,260,80); await p.waitForTimeout(1200);
await mark('idle2'); await p.waitForTimeout(Math.max(500,left()));
await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
const R=await p.evaluate(()=>{ const F=__pf.fr.slice(3); const by={}; for(const f of F){ (by[f.mk]=by[f.mk]||[]).push(f); }
  const q=(a,x)=>{ const s=[...a].sort((m,n)=>m-n); return s.length? s[Math.min(s.length-1,Math.floor(s.length*x))] : 0; };
  const st=(A)=>{ const g=A.map(f=>f.gap), j=A.map(f=>f.js); const dur=g.reduce((a,b)=>a+b,0); return {n:A.length, fps:+(A.length*1000/Math.max(1,dur)).toFixed(1), g50:+q(g,0.5).toFixed(1), g95:+q(g,0.95).toFixed(1), g99:+q(g,0.99).toFixed(1), gmax:+Math.max(...g).toFixed(0), over50:g.filter(x=>x>50).length, over100:g.filter(x=>x>100).length, js50:+q(j,0.5).toFixed(1), js95:+q(j,0.95).toFixed(1), jsmax:+Math.max(...j).toFixed(0)}; };
  const out={all:st(F)}; for(const m in by) out[m]=st(by[m]);
  const rnd=(o)=>{ const r={}; for(const k in o){ const v=o[k]; r[k]= typeof v==='number'? +v.toFixed(1) : v; } return r; };
  const worst=[...F].sort((a,b)=>b.gap-a.gap).slice(0,14).map(rnd), worstJs=[...F].sort((a,b)=>b.js-a.js).slice(0,10).map(rnd);
  const resizes=F.filter(f=>f.resize).length, widths=[...new Set(F.map(f=>f.cw))];
  const bw=__ltm.bw; return {out,worst,worstJs,resizes,widths,dpr:devicePixelRatio,scale:+bw.scale.toFixed(3),zoom:+bw.zoom.toFixed(2),dprCap:G.dprCap}; });
console.log(URL, land?'ngang':'dọc', 'CPU x'+cpu, 'DPR', R.dpr, 'scale', R.scale, 'zoom', R.zoom, 'canvas widths', R.widths, 'resizes', R.resizes, 'dprCap', R.dprCap);
for(const m in R.out) console.log(m.padEnd(8), JSON.stringify(R.out[m]));
console.log('— khung có khoảng cách dài nhất:'); for(const f of R.worst) console.log('  ', JSON.stringify(f));
console.log('— khung tốn JS nhất:'); for(const f of R.worstJs) console.log('  ', JSON.stringify(f));
if(errs.length) console.log('LỖI TRANG:', errs.slice(0,5));
await b.close();
