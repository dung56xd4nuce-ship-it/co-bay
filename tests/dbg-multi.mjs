import { chromium, devices } from 'playwright';
const {defaultBrowserType, ...o}=devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1400);
await p.evaluate(()=>{ __ltm.startBigWar(1); }); await p.waitForTimeout(400);
await p.evaluate(()=>{ const bw=__ltm.bw; bw.nextAI=1e9; bw.nextWaveF={1:1e9}; bw.nextAiScout=1e9;
  const y0=600, x0=1500;
  for(const [dx,dy,t] of [[0,0,'spear'],[180,60,'archer'],[-160,-70,'saber']])
    bw.armies.push({owner:0,type:t,count:300,x:x0+dx,y:y0+dy,to:-1,trail:0,camped:true,ambush:false,food:100}); });
const scr=async(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; const r=document.getElementById('game').getBoundingClientRect();
  const sc=bw.scale; bw.camX=Math.max(0,Math.min(BW.W-r.width/sc,wx-r.width/sc/2)); bw.camY=Math.max(0,Math.min(Math.max(0,BW.H-r.height/sc),wy-r.height/sc/2)); bw.followT=0;
  return [(wx-bw.camX)*sc+r.left,(wy-bw.camY)*sc+r.top]; },[wx,wy]);
// NGƯỜI CHƠI: chạm 2 lần liên tiếp vào đạo giữa (nhịp thật ~250ms), rồi chạm đất xa
let t=await scr(1500,600);
await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(260);
await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(300);
const st1=await p.evaluate(()=>({ selG: __ltm.bw.selG? __ltm.bw.selG.length:0, selA: !!__ltm.bw.selA, time:__ltm.bw.time }));
t=await scr(2400,650); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(300);
const st2=await p.evaluate(()=>({ menu: !!__ltm.bw.menu, rects: (__ltm.bw._menuRects||[]).map(r=>r.id) }));
let st3=null;
if(st2.menu){ const mi=await p.evaluate(()=>{ const r=(__ltm.bw._menuRects||[]).find(r2=>r2.id==='move'); const g=document.getElementById('game').getBoundingClientRect(); return r?[g.left+r.x+r.w/2,g.top+r.y+r.h/2]:null; });
  if(mi){ await p.touchscreen.tap(mi[0],mi[1]); await p.waitForTimeout(300); } }
st3=await p.evaluate(()=>({ moving: __ltm.bw.armies.filter(a=>a.owner===0&&!a.camped&&!a.done).length,
  camped: __ltm.bw.armies.filter(a=>a.owner===0&&a.camped&&!a.done).length, selG: __ltm.bw.selG?__ltm.bw.selG.length:0 }));
console.log(JSON.stringify({st1,st2,st3,errors:errs.slice(0,3)}));
await b.close();
