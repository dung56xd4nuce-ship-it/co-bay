// (5.6) soát bằng mắt: logo menu, công trình kinh tế, xe lương, nút ba lô, đồ trang trí mới
import { chromium } from 'playwright';
const b=await chromium.launch(); const shots=[];
for(const [W,H,tag] of [[852,393,'land'],[393,852,'port']]){ const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:2,isMobile:true,hasTouch:true}); await ctx.addInitScript(()=>{ try{ localStorage.setItem('ltm_tut','1'); }catch(e){} }); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(1200); await p.screenshot({path:`/tmp/shots/a-${tag}-menu.png`});
  if(tag==='land'){
    await p.evaluate(()=>{ G.bwCfg={civ:'rome',map:0}; startBigWar(2); const bw=__ltm.bw; bw.intro=null; document.getElementById('stageIntro').classList.add('hidden'); bw.aiTurn=()=>{}; const e=bw.nodes.find(n=>n.eco==='granary')||bw.nodes.find(n=>n.eco); e.owner=0; bw._updateVision&&bw._updateVision(); const sc=bw.scale0*1.3; bw.zoom=bw.zoomTgt=1.3; bw.camX=e.x-bw.lastVw/sc/2; bw.camY=e.y-bw.lastVh/sc/2;
      const a={owner:0,type:'spear',count:300,x:e.x+260,y:e.y,food:5,from:0,trail:0,camped:true,to:-1,tx:e.x+260,ty:e.y}; bw.armies.push(a); bw.convoys.push({owner:0,x:e.x+150,y:e.y+40,to:a,pct:40,hx:1,spd:60}); bw.convoys.push({owner:1,x:e.x-150,y:e.y+80,to:a,pct:40,hx:-1,spd:60}); });
    await p.waitForTimeout(1500); await p.screenshot({path:`/tmp/shots/a-${tag}-eco.png`});
    await p.evaluate(()=>{ const bw=__ltm.bw; const ns=bw.nodes.filter(n=>n.eco); const out=[]; for(const k of ['farm','granary','train']){ const n=ns.find(q=>q.eco===k); if(n){ n.owner=0; out.push(n); } } bw._updateVision&&bw._updateVision(); window.__eco=out.map(n=>[n.x,n.y,n.eco]); });
    const eco=await p.evaluate(()=>window.__eco); for(const [x,y,k] of eco){ await p.evaluate(([x,y])=>{ const bw=__ltm.bw, sc=bw.scale0*1.2; bw.zoom=bw.zoomTgt=1.2; bw.camX=x-bw.lastVw/sc/2; bw.camY=y-bw.lastVh/sc/2; },[x,y]); await p.waitForTimeout(700); await p.screenshot({path:`/tmp/shots/a-${tag}-${k}.png`}); }
    await p.evaluate(()=>{ save.decor={own:{},on:[]}; for(const d of BW_DECOR) save.decor.own[d.id]=1; save.decor.on=['lions','koipond','luckycat','coinstatue','drumtower','dragonstatue','elephant','bonsai','gate','garden','torches','bunting']; Save.set(save); stopBigWar(true); G.bwCfg={civ:'rome',map:0}; startBigWar(1); const bw=__ltm.bw; bw.intro=null; document.getElementById('stageIntro').classList.add('hidden'); const c0=bw.nodes.find(n=>n.camp&&n.owner===0); bw.zoom=bw.zoomTgt=1.6; const sc=bw.scale0*1.6; bw.camX=c0.x-bw.lastVw/sc/2; bw.camY=c0.y-20-bw.lastVh/sc/2; });
    await p.waitForTimeout(1500); await p.screenshot({path:`/tmp/shots/a-${tag}-decor.png`});
    await p.evaluate(()=>{ stopBigWar(true); openGear(); document.getElementById('bToDecor').click(); }); await p.waitForTimeout(800); await p.screenshot({path:`/tmp/shots/a-${tag}-shop.png`}); }
  console.log(tag,'errs',errs.slice(0,3)); await ctx.close(); }
await b.close();
