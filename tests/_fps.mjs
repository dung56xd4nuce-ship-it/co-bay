import { chromium, devices } from 'playwright';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices['Pixel 7 landscape'];
const ctx=await b.newContext(o); const p=await ctx.newPage(); await p.goto(process.argv[2]); await p.waitForTimeout(1000);
for(const N of [0,120]){
const fps=await p.evaluate(async(N)=>{ G.bwCfg={royale:36,seed:91,map:2}; startBigWar(5); const bw=__ltm.bw; bw.intro=null; bw.aiTurn=()=>{};
  const cap=bw.nodes.find(n=>n.camp&&n.owner===0); bw.nodes.filter(n=>!n.camp).sort((a,b)=>Math.hypot(a.x-cap.x,a.y-cap.y)-Math.hypot(b.x-cap.x,b.y-cap.y)).slice(0,N).forEach(n=>{n.owner=0; n.count=Math.max(n.count,50);});
  await new Promise(r=>setTimeout(r,500)); const res=[];
  for(const mv of [0,40]){ let n=0; const t0=performance.now(); await new Promise(res2=>{ const tick=()=>{ n++; if(mv) bw.camX=(n*mv)%9000; if(performance.now()-t0<2500) requestAnimationFrame(tick); else res2(); }; requestAnimationFrame(tick); }); res.push(+(n/2.5).toFixed(1)); }
  return res; },N);
console.log(process.argv[2].includes('8767')?'CŨ':'MỚI', N,'cứ điểm: đứng yên / cuộn', fps); }
await b.close();
