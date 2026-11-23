import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1400);
const bb=await p.evaluate(()=>{ const r=document.getElementById('bBW').getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2]; });
await p.touchscreen.tap(bb[0],bb[1]); await p.waitForTimeout(600);
const scr=async(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; const r=document.getElementById('game').getBoundingClientRect();
  const viewW=r.width/bw.scale; bw.camX=Math.max(0,Math.min(BW.W-viewW,wx-viewW/2)); bw.followT=0;
  return [(wx-bw.camX)*bw.scale+r.left, wy*bw.scale+r.top]; },[wx,wy]);
// dựng cụm 3 đạo mai phục + node bật mai phục
const st=await p.evaluate(()=>{ const bw=__ltm.bw;
  const nd=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.camp)||bw.nodes[0];
  nd.ter='forest';
  const mk=(dx,dy,t)=>({owner:0,type:t,count:250,x:nd.x+dx,y:nd.y+dy,to:-1,trail:0,camped:true,ambush:true});
  bw.armies.push(mk(240,40,'spear'),mk(300,-60,'archer'),mk(180,-120,'saber'));
  bw._updateVision();
  return {ndId:nd.id, nx:nd.x, ny:nd.y, ax:nd.x+240, ay:nd.y+40}; });
// 1) chọn node, bật mai phục bằng nút, rồi chạm đạo quân khác -> phải CHUYỂN CHỌN
let t=await scr(st.nx,st.ny); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(250);
const btn=await p.evaluate(()=>__ltm.bw._ambBtn?[__ltm.bw._ambBtn.x+__ltm.bw._ambBtn.w/2,__ltm.bw._ambBtn.y+__ltm.bw._ambBtn.h/2]:null);
let fixOK=null;
if(btn){ const org=await p.evaluate(()=>{ const r=document.getElementById('game').getBoundingClientRect(); return [r.left,r.top]; });
  await p.touchscreen.tap(org[0]+btn[0], org[1]+btn[1]); await p.waitForTimeout(200);
  t=await scr(st.ax,st.ay); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(200);
  fixOK=await p.evaluate((id)=>{ const bw=__ltm.bw; return { nodeAmbush: !!bw.nodes[id].ambush, nodeKept: bw.nodes[id].count>0, selIsArmy: !!bw.selA }; }, st.ndId); }
// 2) kích đúp -> chọn cả cụm
t=await scr(st.ax,st.ay); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(120); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(250);
const grp=await p.evaluate(()=>__ltm.bw.selG? __ltm.bw.selG.length : 0);
await p.screenshot({path:`test/${which}-v12.png`});
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const lp=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(lp); else res(Math.round(n/2)); }; requestAnimationFrame(lp); }));
console.log(which, JSON.stringify({fixOK, grpSelected:grp, fps}), 'errors', errs);
await b.close();
