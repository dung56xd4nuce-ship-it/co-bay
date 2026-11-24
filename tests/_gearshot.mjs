// Ảnh chụp nhanh: màn Quân nhu, Lò rèn, bảng 🎒 trong trận (ngang + dọc)
import { launch, open, DEVICES, PORTRAIT } from './lib.mjs';
const b=await launch();
for(const [tag,dev] of [['ngang',DEVICES[0][1]],['doc',PORTRAIT[1][1]]]){
  const T=await open(b,dev); const {p}=T;
  await T.ev(()=>{ save.xu=900; Save.set(save); refreshXu(); });
  await T.tapEl('#bGear'); await p.waitForTimeout(300);
  for(const id of ['bun','tea','compass','scarecrow']){ await p.evaluate((id)=>document.querySelector(`[data-buy="${id}"]`).scrollIntoView({block:'center'}),id); await p.waitForTimeout(80); const r=await T.tapEl(`[data-buy="${id}"]`); if(!r.ok) console.log('không chạm được',id,r.why); await p.waitForTimeout(120); }
  await p.evaluate(()=>document.querySelector('#gear .card').scrollTo(0,0));
  await p.screenshot({path:`/tmp/shots/gear-${tag}-shop.png`});
  await T.tapEl('#bToForge'); await p.waitForTimeout(300); const fb=await p.$('#forgeList .fcard .btn'); if(fb){ await fb.scrollIntoViewIfNeeded(); await fb.tap(); } await p.waitForTimeout(200);
  await p.screenshot({path:`/tmp/shots/gear-${tag}-forge.png`});
  await T.startBattle({map:3,civ:'rome'},3); await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0); await p.waitForTimeout(600);
  const st=await T.ev(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.notes=[]; const c=bw.nodes.find(n=>n.camp&&n.owner===0); const a={owner:0,type:'spear',count:900,x:c.x+260,y:c.y+120,to:-1,tx:c.x+260,ty:c.y+120,trail:0,camped:true,food:22}; bw.armies.push(a); bw.selA=a; a.teaT=25; a.smokeT=18; c.scareT=44; bw._gearLive=true; return {gear:bw.gear.map(g=>g.id),up:bw.up,btn:bw._gearBtn}; });
  await p.waitForTimeout(400); const btn=await T.ev(()=>__ltm.bw._gearBtn); await T.tap(btn.x+btn.w/2,btn.y+btn.h/2); await p.waitForTimeout(350);
  await p.screenshot({path:`/tmp/shots/gear-${tag}-menu.png`});
  console.log(tag,JSON.stringify(st),'menu',JSON.stringify(await T.ev(()=>__ltm.bw._gearMenu)),'errs',T.errs.slice(0,3));
  await T.ctx.close(); }
await b.close();
