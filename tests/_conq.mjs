// (5.7) ảnh chụp luồng Chinh phạt như người chơi: menu → BATTLE → CONQUEST → chọn nước → Bộ lạc; rồi Nội chiến, Đại chiến
import { launch, open, DEVICES } from './lib.mjs';
const b=await launch(); const out='/tmp/cqshots'; (await import('fs')).mkdirSync(out,{recursive:true});
for(const [name,dev] of DEVICES){ const T=await open(b,dev), tag=name.startsWith('Android')?'and':'ios';
  await T.tapEl('#bBW'); await T.vis('#bossPick'); await T.p.screenshot({path:`${out}/${tag}-1-boss.png`});
  await T.tapEl('#bBossRoyale'); await T.vis('#civPick'); await T.p.screenshot({path:`${out}/${tag}-2-civ.png`});
  await T.tapEl('#civGo'); await T.p.waitForTimeout(5200); await T.p.screenshot({path:`${out}/${tag}-3-tribe.png`});
  await T.ev(()=>__ltm.bw.skipIntro&&__ltm.bw.skipIntro()); await T.p.waitForTimeout(800); await T.p.screenshot({path:`${out}/${tag}-4-tribe-home.png`});
  await T.ev(()=>{ const bw=__ltm.bw; bw.zoomAt(0.3,bw.lastVw/2,bw.lastVh/2); }); await T.p.waitForTimeout(600); await T.p.screenshot({path:`${out}/${tag}-5-tribe-far.png`});
  for(const st of ['civil','great']){ await T.ev((st)=>{ __ltm.G.bwCfg={royale:st==='great'?43:17,conq:st,seed:123,civ:'daiviet',diff:1,bio:1,L:{camp:st==='great'?14000:7000}}; __ltm.startBigWar(5); __ltm.bw.skipIntro&&__ltm.bw.skipIntro(); },st);
    await T.p.waitForTimeout(1500); await T.p.screenshot({path:`${out}/${tag}-6-${st}.png`});
    await T.ev(()=>{ const bw=__ltm.bw; bw.zoomAt(0.15,bw.lastVw/2,bw.lastVh/2); }); await T.p.waitForTimeout(800); await T.p.screenshot({path:`${out}/${tag}-7-${st}-far.png`}); }
  console.log(name,'errors',JSON.stringify(T.errs.slice(0,5)));
  await T.ctx.close(); }
await b.close();
