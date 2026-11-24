// Mỗi bước dựng ô bản đồ tốn bao lâu? (CPU chậm 4 lần) — để chia bước đủ nhỏ, không bước nào làm rớt khung hình
import { chromium } from 'playwright';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:400,height:869},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage(); await p.goto(process.argv.find(a=>a.startsWith('http'))||'http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(600);
const cdp=await ctx.newCDPSession(p);
await p.evaluate(()=>{ G.bwCfg={royale:36,seed:61,civ:'vn'}; startBigWar(5); __ltm.bw.intro=null; });
await p.waitForTimeout(2500); await p.evaluate(()=>{ G.paused=true; });
await cdp.send('Emulation.setCPUThrottlingRate',{rate:+(process.argv.find(a=>a.startsWith('--cpu='))||'--cpu=4').split('=')[1]});
const R=await p.evaluate(()=>{ const bw=__ltm.bw; const out={};
  for(const lod of [1,2,3]){ const TW=512/[0.125,0.25,0.5,1][lod]; const nx=Math.ceil(BW.W/TW), ny=Math.ceil(BW.H/TW); const st={}; let tiles=0, tot=0, worstTile=0;
    for(let q=0;q<14;q++){ const tx=(q*7+3)%nx, ty=(q*3+1)%ny; const g=bw.mapTileGen(lod,tx,ty); let t0=performance.now(), tt=0; for(;;){ const r=g.next(); const d=performance.now()-t0; tt+=d; const tag=r.done? 'end' : r.value; const s=st[tag]||(st[tag]={n:0,sum:0,max:0}); s.n++; s.sum+=d; if(d>s.max) s.max=d; if(r.done) break; t0=performance.now(); }
      tiles++; tot+=tt; if(tt>worstTile) worstTile=tt; }
    const o={}; for(const k in st) o[k]=[st[k].n, +(st[k].sum/st[k].n).toFixed(1), +st[k].max.toFixed(1)]; out['lod'+lod]={avgTile:+(tot/tiles).toFixed(0), worstTile:+worstTile.toFixed(0), steps:o}; }
  return out; });
for(const k in R) console.log(k, 'ô TB', R[k].avgTile,'ms · tệ nhất', R[k].worstTile,'ms ·  [số bước, TB, tối đa]', JSON.stringify(R[k].steps));
await b.close();
