// A/B nhanh: đo cảnh "vào trận" + "đứng yên" khi bóp CPU 4×. node test/_perfab.mjs <url> <mode> [noIntro]
import { launch, open, DEVICES } from './lib.mjs';
const url=process.argv[2], mode=process.argv[3]||'1v1', noIntro=process.argv[4]==='1', mapK=process.argv[5]||'map';
const b=await launch(); const T=await open(b,DEVICES[0][1],{url}); const {p,cdp}=T; await p.waitForTimeout(1500); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await T.ev(([mode,noIntro,mapK])=>{ window.__pf={d:[],f:[]}; let last=performance.now(); const f=(t)=>{ __pf.f.push(t-last); last=t; requestAnimationFrame(f); }; requestAnimationFrame(f);
  G.bwCfg= mode==='royale'? {royale:36,seed:77,map:3,civ:'rome'} : {[mapK]:6,civ:'rome'}; startBigWar(mode==='royale'?5:4); if(noIntro){ const e=document.getElementById('stageIntro'); if(e) e.classList.add('hidden'); }
  const bw=__ltm.bw, D=bw.draw.bind(bw); bw.draw=(...a)=>{ const t=performance.now(); D(...a); __pf.d.push(performance.now()-t); }; },[mode,noIntro,mapK]);
await p.waitForTimeout(4000); const r1=await T.ev(()=>{ const r={f:__pf.f.slice(1),d:__pf.d.slice()}; __pf.f.length=0; __pf.d.length=0; const bw=__ltm.bw; if(bw.skipIntro) bw.skipIntro(); else bw.intro=null; return r; });
await p.waitForTimeout(1500); await T.ev(()=>{ __pf.f.length=0; __pf.d.length=0; }); await p.waitForTimeout(2500); const r2=await T.ev(()=>({f:__pf.f.slice(1),d:__pf.d.slice()}));
const S=(r)=>{ const tot=r.f.reduce((s,x)=>s+x,0)||1, ds=[...r.d].sort((a,b)=>a-b); return `fps ${(r.f.length/tot*1000).toFixed(1)} maxFrame ${Math.max(...r.f).toFixed(0)} drawMed ${(ds[ds.length>>1]||0).toFixed(1)} drawMax ${Math.max(0,...r.d).toFixed(0)}`; };
console.log(url.replace('http://localhost:',''),mode,noIntro?'noIntro':'',mapK,'| entry:',S(r1),'| idle:',S(r2)); await b.close();
