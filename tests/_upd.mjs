// Bước mô phỏng nào nặng nhất? (CPU chậm 4 lần, giữa ván Quần Hùng)
import { chromium } from 'playwright';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:400,height:869},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage(); await p.goto(process.argv.find(a=>a.startsWith('http'))||'http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(600);
const cdp=await ctx.newCDPSession(p);
await p.evaluate(()=>{ G.paused=true; G.bwCfg={royale:36,seed:61,civ:'vn'}; startBigWar(5); __ltm.bw.intro=null; });
await cdp.send('Emulation.setCPUThrottlingRate',{rate:+(process.argv.find(a=>a.startsWith('--cpu='))||'--cpu=4').split('=')[1]});
const R=await p.evaluate(()=>{ const bw=__ltm.bw, P=BigWar.prototype; let cur=null; const names=['aiTurn','findPath','_updateVision','supplyTick','aiDiplomacy','convoyStep','checkVictory','supplyCap','arrive','bEnd','send','sendCoordinated','aiCombo','navNearest','pathEta','canReach','myPower','startBattle','checkCamp'];
  for(const nm of names){ const f=P[nm]; if(!f) continue; P[nm]=function(){ const t0=performance.now(); try{ return f.apply(this,arguments); } finally{ if(cur){ cur[nm]=(cur[nm]||0)+performance.now()-t0; cur['#'+nm]=(cur['#'+nm]||0)+1; } } }; }
  const all=[]; const MIN=12; for(let i=0;i<MIN*60*20;i++){ cur={}; const a=performance.now(); bw.update(0.05); const d=performance.now()-a; cur.ms=d; cur.t=+bw.time.toFixed(1); cur.arm=bw.armies.length; all.push(cur); cur=null; if(bw.over) break; }
  const s=all.map(x=>x.ms).sort((a,b)=>a-b); const q=(x)=>+s[Math.min(s.length-1,Math.floor(s.length*x))].toFixed(2);
  const rnd=(o)=>{ const r={}; for(const k in o){ const v=o[k]; r[k]= typeof v==='number'? +v.toFixed(1) : v; } return r; };
  return {n:all.length, p50:q(0.5), p95:q(0.95), p99:q(0.99), p999:q(0.999), max:q(1), over8:s.filter(x=>x>8).length, over16:s.filter(x=>x>16).length, worst:[...all].sort((a,b)=>b.ms-a.ms).slice(0,12).map(rnd), over:bw.over}; });
console.log(JSON.stringify({n:R.n,p50:R.p50,p95:R.p95,p99:R.p99,p999:R.p999,max:R.max,over8:R.over8,over16:R.over16,over:R.over})); for(const w of R.worst) console.log('  ',JSON.stringify(w));
await b.close();
