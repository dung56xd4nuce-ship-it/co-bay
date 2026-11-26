import { launch, open, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
for(const [dn,dev] of [DEVICES[0],PORTRAIT[1]]){ const T=await open(b,dev), tag=dn.includes('dọc')?'por':'land';
  await T.ev(()=>{ G.bwCfg={royale:17,conq:'civil',seed:44,civ:'rome',diff:1,bio:1,L:{camp:7000}}; startBigWar(5); __ltm.bw.skipIntro&&__ltm.bw.skipIntro(); const bw=__ltm.bw, U=Object.getPrototypeOf(bw).update; for(let i=0;i<20*240;i++){ U.call(bw,0.05); if(i%400===0) bw.nodes[0].count+=(i%800? -600 : 900); } document.getElementById("stageIntro").classList.add("hidden"); });
  await T.p.waitForTimeout(900); await T.p.screenshot({path:`/tmp/cqshots/stat-${tag}.png`}); await T.ctx.close(); }
await b.close();
