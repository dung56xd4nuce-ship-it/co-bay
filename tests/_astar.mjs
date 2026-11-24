// A* tốn bao nhiêu? đếm số ô đã duyệt và thời gian cho từng lần tìm đường trong 8 phút game (CPU thật, không giảm tốc)
import { chromium } from 'playwright';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:800,height:400},deviceScaleFactor:1});
const p=await ctx.newPage(); await p.goto(process.argv.find(a=>a.startsWith('http'))||'http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(500);
const R=await p.evaluate(()=>{ G.paused=true; G.bwCfg={royale:36,seed:63,civ:'vn'}; startBigWar(5); const bw=__ltm.bw; bw.intro=null; const P=BigWar.prototype, f=P.findPath; const L=[];
  P.findPath=function(key,x0,y0,x1,y1){ const N=this.nav, c0=N? N.cache.size : 0, t0=performance.now(); const r=f.apply(this,arguments); const ms=performance.now()-t0; const N2=this.nav; let closed=0; const T=N2.tick, cl=N2.cl; if(ms>0.3){ for(let i=0;i<N2.n;i++) if(cl[i]===T) closed++; }
    L.push({key,ms,closed,d:Math.round(Math.hypot(x1-x0,y1-y0)),ok:r.ok,n:N2.n,pts:r.pts.length}); return r; };
  for(let i=0;i<8*60*20&&!bw.over;i++) bw.update(0.05);
  const s=L.map(x=>x.ms).sort((a,b)=>a-b), q=(x)=>+s[Math.min(s.length-1,Math.floor(s.length*x))].toFixed(2);
  return {calls:L.length, total:+s.reduce((a,b)=>a+b,0).toFixed(0), p50:q(0.5), p90:q(0.9), p99:q(0.99), max:q(1), cells:L[0]&&L[0].n, t:Math.round(bw.time),
    worst:[...L].sort((a,b)=>b.ms-a.ms).slice(0,10).map(x=>({key:x.key,ms:+x.ms.toFixed(1),closed:x.closed,d:x.d,ok:x.ok,pts:x.pts})) }; });
console.log(JSON.stringify({calls:R.calls,totalMs:R.total,p50:R.p50,p90:R.p90,p99:R.p99,max:R.max,cells:R.cells,t:R.t})); for(const w of R.worst) console.log('  ',JSON.stringify(w));
await b.close();
