// Chơi bằng CHẠM THẬT: chọn đạo ta → chạm đạo địch gần trại → Truy kích → đánh xong quân tự về trại (chụp ảnh trước/sau)
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape', tag=dev.split(' ')[0];
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
await p.evaluate(()=>{ G.bwCfg={map:3}; startBigWar(3); __ltm.bw.intro=null; }); await p.waitForTimeout(400);
await p.evaluate(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.nextAI=1e9; bw.armies.length=0; bw.notes=[];
  const n=bw.nodes.find(x=>x.owner===0&&x.camp); window.__N=n;
  window.__A=[{owner:0,type:'cavalry',count:900,x:n.x+260,y:n.y-60,to:-1,trail:0,food:90,done:false,camped:true},{owner:0,type:'spear',count:700,x:n.x+250,y:n.y+90,to:-1,trail:0,food:90,done:false,camped:true}];
  window.__E={owner:1,type:'archer',count:400,x:n.x+430,y:n.y+20,to:-1,trail:0,food:90,done:false,camped:true};
  bw.armies.push(...window.__A,window.__E); bw.zoom=bw.zoomTgt=1.3; const s=bw.scale0*1.3; bw.camX=n.x-120; bw.camY=n.y-bw.lastVh/s/2; bw._updateVision(); });
await p.waitForTimeout(300);
const sp=(a)=>p.evaluate((i)=>{ const bw=__ltm.bw, a= i<0? window.__E : window.__A[i]; return [(a.x-bw.camX)*bw.scale,(a.y-26-bw.camY)*bw.scale]; },a);
const c0=await p.evaluate(()=>Math.round(window.__N.count));
// chạm đúp chọn cả cụm 2 đạo
let q=await sp(0); await p.touchscreen.tap(q[0],q[1]); await p.waitForTimeout(120); await p.touchscreen.tap(q[0],q[1]); await p.waitForTimeout(300);
const grp=await p.evaluate(()=>(__ltm.bw.selG||[]).length);
q=await sp(-1); await p.touchscreen.tap(q[0],q[1]); await p.waitForTimeout(300);
await p.evaluate(()=>{ if(__ltm.bw.menu) __ltm.bw.menuPick('hunt'); });
await p.screenshot({path:`/tmp/ab_${tag}_1_truy_kich.png`});
let t=0; while(t<60 && !(await p.evaluate(()=>window.__E.done))){ await p.waitForTimeout(500); t+=0.5; }
await p.waitForTimeout(800); await p.screenshot({path:`/tmp/ab_${tag}_2_vua_thang.png`});
await p.waitForTimeout(6000); await p.screenshot({path:`/tmp/ab_${tag}_3_ve_trai.png`});
const r=await p.evaluate(()=>({ngoaiDong:__ltm.bw.armies.filter(a=>a.owner===0&&!a.done&&a.count>0).length, quanTrai:Math.round(window.__N.count)}));
console.log(dev,`chọn cụm=${grp} | trận xong sau ~${t}s | trại ${c0} → ${r.quanTrai} | đạo còn ngoài đồng: ${r.ngoaiDong}`,'| errors',errs.length?errs:'none'); await b.close();
