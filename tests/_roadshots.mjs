// Ảnh trước/sau của đường đi: cùng bản đồ, cùng chỗ đứng, cùng mức zoom (màn dọc như máy người chơi)
import { chromium } from 'playwright';
const URL=process.argv.find(a=>a.startsWith('http'))||'http://localhost:8766/index.html', tag=(process.argv.find(a=>a.startsWith('--tag='))||'--tag=new').split('=')[1];
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:400,height:869},deviceScaleFactor:3,isMobile:true,hasTouch:true});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.goto(URL); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(600);
await p.evaluate(()=>{ G.bwCfg={royale:36,seed:61,map:3,civ:'vn'}; startBigWar(5); const bw=__ltm.bw; bw.intro=null; bw.aiTurn=()=>{}; bw.notes=[]; G.paused=true; const r=document.getElementById('rotate'); if(r) r.style.display='none'; });
await p.waitForFunction(()=>__ltm.bw&&__ltm.bw.lastVw>0&&__ltm.bw.scale0>0); await p.waitForTimeout(300);
const sharp=async(ms=15000)=>{ const t0=Date.now(); for(;;){ const r=await p.evaluate(()=>({p:__ltm.bw._mapPending,f:__ltm.bw._mapFading||0})); if((!r.p&&!r.f)||Date.now()-t0>ms) break; await p.waitForTimeout(150); } await p.waitForTimeout(300); };
const views=[['xa',0.115,600,0],['vua',0.2,300,0],['gan',0.42,200,0],['vua2',0.2,2600,900],['gan2',0.42,2600,900]];
for(const [name,sc,ox,oy] of views){
  await p.evaluate(([sc,ox,oy])=>{ const bw=__ltm.bw; const cap=bw.nodes.find(n=>n.camp&&n.owner===bw.localFid); const z=sc/bw.scale0; bw.zoom=bw.zoomTgt=z; bw.hudSeen=0; bw.camX=cap.x+ox-bw.lastVw/sc/2; bw.camY=cap.y+oy-bw.lastVh/sc/2; },[sc,ox,oy]);
  await p.waitForTimeout(500); await sharp(); await p.screenshot({path:`/tmp/shots/road-${tag}-${name}.png`}); }
const st=await p.evaluate(()=>{ const bw=__ltm.bw; return {roads:bw.roads.length,nodes:bw.nodes.length,curved:bw.roads.filter(r=>r.pts&&r.pts.length>2).length}; });
console.log(tag, JSON.stringify(st), 'lỗi:', errs.slice(0,3)); await b.close();
