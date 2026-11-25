import { launch, open, DEVICES } from './lib.mjs';
const b=await launch(); const out='/tmp/cqshots';
const [name,dev]=DEVICES[0]; const T=await open(b,dev);
for(const st of ['tribe','civil','great']){
  await T.ev((st)=>{ const S={tribe:[9,3000],civil:[17,7000],great:[43,14000]}[st]; __ltm.G.bwCfg={royale:S[0],conq:st,seed:321,civ:'rome',diff:1,bio:1,L:{camp:S[1]}}; __ltm.startBigWar(5); },st);
  await T.p.waitForTimeout(400); await T.ev(()=>__ltm.bw.skipIntro&&__ltm.bw.skipIntro()); await T.p.waitForTimeout(1500);
  for(const z of [1,0.18]){
    await T.ev((z)=>{ const bw=__ltm.bw; bw.zoomAt(z,bw.lastVw/2,bw.lastVh/2); window.__dt=[]; if(!window.__hooked){ window.__hooked=1; const P=Object.getPrototypeOf(__ltm.bw), d0=P.draw; P.draw=function(...a){ const t=performance.now(); const r=d0.apply(this,a); window.__dt.push(performance.now()-t); return r; }; } },z);
    // giữ màn hình "đang thao tác" bằng kéo nhẹ
    for(let i=0;i<6;i++) await T.drag(900,400,700,380,8);
    const r=await T.ev(()=>{ const a=window.__dt.slice().sort((p,q)=>p-q); return {n:a.length, med:a[a.length>>1], p95:a[Math.floor(a.length*0.95)]}; });
    console.log(st,'zoom',z,'nodes',await T.ev(()=>__ltm.bw.nodes.length),JSON.stringify(r));
    await T.p.screenshot({path:`${out}/perf-${st}-${z}.png`}); } }
console.log('errs',JSON.stringify(T.errs.slice(0,4)));
await b.close();
