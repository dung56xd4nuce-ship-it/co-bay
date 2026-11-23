// KÉO MÀN HÌNH BẰNG NGÓN TAY THẬT (sự kiện touch qua CDP): nhiều lần kéo liên tiếp, đang phóng to, trên bản đồ lớn và 1v1
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const cdp=await ctx.newCDPSession(p);
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const {width:W,height:H}=p.viewportSize();
const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
const drag=async(x0,y0,dx,dy,steps=12)=>{ const cams=[]; await touch('touchStart',x0,y0); await p.waitForTimeout(30);
  for(let i=1;i<=steps;i++){ await touch('touchMove',x0+dx*i/steps,y0+dy*i/steps); await p.waitForTimeout(20); cams.push(await p.evaluate(()=>[__ltm.bw.camX,__ltm.bw.camY])); }
  await touch('touchEnd'); await p.waitForTimeout(120); cams.push(await p.evaluate(()=>[__ltm.bw.camX,__ltm.bw.camY])); return cams; };
const fails=[];
for(const mode of ['royale','1v1']){
  await p.evaluate((mode)=>{ G.bwCfg= mode==='royale'? {royale:36,seed:88,map:4} : {map:5}; startBigWar(mode==='royale'?5:4); const bw=__ltm.bw; bw.intro=null; bw.nextAI=1e9; __ltm.G.paused=true; },mode);
  for(const z of [1,1.6,2.4]){
    await p.evaluate((z)=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=z; bw.camX=BW.W*0.4; bw.camY=BW.H*0.4; },z); await p.waitForTimeout(150);
    const sc=await p.evaluate(()=>__ltm.bw.scale);
    // 6 lần kéo liên tiếp theo các hướng khác nhau
    const moves=[[-200,-120],[150,90],[-60,140],[220,-60],[0,-150],[-120,0]];
    for(const [dx,dy] of moves){
      const c0=await p.evaluate(()=>[__ltm.bw.camX,__ltm.bw.camY]);
      const cams=await drag(W*0.5,H*0.55,dx,dy);
      const c1=cams[cams.length-1];
      // camera phải đi đúng ngược chiều ngón tay theo tỉ lệ, không nhảy (trừ khi chạm biên)
      const ex=[c0[0]-dx/sc, c0[1]-dy/sc];
      const maxY=await p.evaluate(()=>Math.max(0,BW.H-(__ltm.bw.lastVh||600)/__ltm.bw.scale)), maxX=await p.evaluate(()=>BW.W-(__ltm.bw.lastVw||1200)/__ltm.bw.scale);
      const cl=[Math.max(0,Math.min(maxX,ex[0])),Math.max(0,Math.min(maxY,ex[1]))];
      const err=Math.hypot(c1[0]-cl[0],c1[1]-cl[1]);
      // bước nhảy lớn nhất giữa 2 lần di ngón liền nhau
      let jump=0, prev=c0; for(const c of cams){ jump=Math.max(jump,Math.hypot(c[0]-prev[0],c[1]-prev[1])); prev=c; }
      const stepExp=Math.hypot(dx,dy)/12/sc;
      if(err>6||jump>stepExp*2.5+3) fails.push(`${mode} z${z} kéo(${dx},${dy}): lệch ${err.toFixed(0)}px, bước nhảy ${jump.toFixed(0)} (kỳ vọng ~${stepExp.toFixed(0)})`);
    }
  }
}
console.log(dev,'| lỗi:',fails.length?fails:'không'); console.log('errors',errs.length?errs:'none'); await b.close();
