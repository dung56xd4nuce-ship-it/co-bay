// Hai ngón thu phóng → nhấc 1 ngón → kéo tiếp bằng ngón còn lại: không giật, điểm giữa 2 ngón đứng yên
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); const cdp=await ctx.newCDPSession(p);
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const {width:W,height:H}=p.viewportSize(); const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
const out=[];
for(const mode of ['royale','1v1']){
  await p.evaluate((mode)=>{ G.bwCfg= mode==='royale'? {royale:36,seed:88,map:4} : {map:5}; startBigWar(mode==='royale'?5:4); const bw=__ltm.bw; bw.intro=null; __ltm.G.paused=true; bw.zoom=bw.zoomTgt=1.2; bw.camX=BW.W*0.4; bw.camY=BW.H*0.3; },mode); await p.waitForTimeout(150);
  const cx=W*0.5, cy=H*0.5; const wAt=()=>p.evaluate(([x,y])=>{const bw=__ltm.bw; return [bw.camX+x/bw.scale, bw.camY+y/bw.scale];},[cx,cy]);
  const w0=await wAt();
  await T('touchStart',[{x:cx-60,y:cy,id:1},{x:cx+60,y:cy,id:2}]);
  for(let i=1;i<=10;i++){ await T('touchMove',[{x:cx-60-i*10,y:cy,id:1},{x:cx+60+i*10,y:cy,id:2}]); await p.waitForTimeout(25); }
  await p.waitForTimeout(400); const z=await p.evaluate(()=>__ltm.bw.zoom); const w1=await wAt();
  // nhấc ngón 2, kéo ngón 1
  await T('touchEnd',[{x:cx+160,y:cy,id:2}]); await p.waitForTimeout(30);
  const c0=await p.evaluate(()=>[__ltm.bw.camDrag??__ltm.bw.camX,__ltm.bw.camY]); let jump=0, prev=c0;
  for(let i=1;i<=10;i++){ await T('touchMove',[{x:cx-160+i*12,y:cy+i*6,id:1}]); await p.waitForTimeout(20); const c=await p.evaluate(()=>[__ltm.bw.camDrag??__ltm.bw.camX,__ltm.bw.camY]); jump=Math.max(jump,Math.hypot(c[0]-prev[0],c[1]-prev[1])); prev=c; }
  await T('touchEnd',[]); const sc=await p.evaluate(()=>__ltm.bw.scale);
  out.push(`${mode}: zoom 1.2→${z.toFixed(2)}, điểm giữa 2 ngón lệch ${Math.hypot(w1[0]-w0[0],w1[1]-w0[1]).toFixed(1)}px, bước kéo lớn nhất ${jump.toFixed(0)} (kỳ vọng ~${(Math.hypot(12,6)/sc).toFixed(0)})`);
}
console.log(dev); out.forEach(l=>console.log('  '+l)); console.log('  errors',errs.length?errs:'none'); await b.close();
