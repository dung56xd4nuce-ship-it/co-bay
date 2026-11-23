import { chromium, devices } from 'playwright';
const {defaultBrowserType, ...o}=devices['Pixel 7 landscape'];
const b=await chromium.launch(); 
const ctx=await b.newContext({...o, offline:false});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const reqs=[]; p.on('request',r=>{ if(!r.url().startsWith('http://localhost')) reqs.push(r.url()); });
await p.goto('http://localhost:8767/index.html'); await p.waitForTimeout(1500);
// mô phỏng offline hoàn toàn sau khi tải file (như mở file từ máy, không mạng)
await ctx.setOffline(true);
await p.evaluate(()=>window.__ltm.startBigWar(2)); await p.waitForTimeout(400);
const st=await p.evaluate(()=>{ const bw=__ltm.bw; for(let k=0;k<20*60;k++) bw.update(1/60); return {nodes:bw.nodes.length, art:!!ArtImages['struct:village'], fx:!!ArtImages['fx:clash1']}; });
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const lp=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(lp); else res(Math.round(n/2)); }; requestAnimationFrame(lp); }));
console.log(JSON.stringify({st, fps, externalRequests: reqs, errors: errs}));
await b.close();
