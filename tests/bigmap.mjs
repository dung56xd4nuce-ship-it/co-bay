// Quần Hùng bản đồ lớn: thời gian tạo, số node, FPS khi cuộn/thu phóng, tốc độ mô phỏng
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const g=await p.evaluate(()=>{ const t0=performance.now(); G.bwCfg={royale:36, seed:77}; startBigWar(5); const bw=__ltm.bw; const t1=performance.now();
  const own={}; for(const n of bw.nodes) own[n.owner]=(own[n.owner]||0)+1;
  return {ms:Math.round(t1-t0), W:BW.W, H:BW.H, nodes:bw.nodes.length, nations:new Set(bw.nodes.filter(n=>n.camp).map(n=>n.owner)).size, neutral:own[2], roads:bw.roads.length, seeds:bw.terSeeds.length, mine:own[0]}; });
console.log(dev, JSON.stringify(g));
await p.waitForTimeout(5000); // cảnh mở đầu
const fps=async(label,fn)=>{ const r=await p.evaluate(async(src)=>{ const f=eval(src); let n=0; const t0=performance.now(); return await new Promise(res=>{ const tick=()=>{ n++; f(n); if(performance.now()-t0<3000) requestAnimationFrame(tick); else res(n/((performance.now()-t0)/1000)); }; requestAnimationFrame(tick); }); }, fn.toString());
  console.log('  FPS', label, r.toFixed(1)); };
await fps('đứng yên', ()=>{});
await fps('cuộn ngang+dọc', (n)=>{ const bw=__ltm.bw; bw.camX=(n*40)%15000; bw.camY=(n*15)%4000; });
await fps('thu nhỏ tối đa', (n)=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=0.3; bw.camX=(n*60)%12000; });
const sim=await p.evaluate(()=>{ const bw=__ltm.bw; const t0=performance.now(); for(let i=0;i<300;i++) bw.update(0.1); return {ms_per_30s:Math.round(performance.now()-t0), armies:bw.armies.length, battles:bw.battles.filter(b=>!b.done).length}; });
console.log('  mô phỏng 30s game:', JSON.stringify(sim));
await p.screenshot({path:`/tmp/big_${dev.split(' ')[0]}.png`});
console.log('  errors', errs.length?errs.slice(0,3):'none'); await b.close();
