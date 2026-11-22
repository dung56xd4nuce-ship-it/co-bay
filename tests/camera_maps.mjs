// v2.7: kiểm tra camera trên MỌI bản đồ (20 solo + 20 Quần Hùng): kéo tới biên, thu phóng, không trôi
import { chromium, devices } from 'playwright';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices['Pixel 7 landscape'];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const vp=p.viewportSize(); const cx=vp.width/2, cy=vp.height/2;
const fails=[]; let n=0;
for(const royale of [false,true]) for(let mi=0;mi<20;mi++){
  await p.evaluate(([royale,mi])=>{ G.bwCfg= royale?{royale:36,seed:77+mi,map:mi}:{map:mi}; startBigWar(royale?5:3); __ltm.bw.intro=null; __ltm.bw.nextAI=1e9; __ltm.bw.time=0; },[royale,mi]);
  await p.waitForTimeout(400); n++;
  const st=()=>p.evaluate(()=>({x:__ltm.bw.camX,y:__ltm.bw.camY,z:__ltm.bw.zoom,sc:__ltm.bw.scale,W:BW.W,H:BW.H,vw:__ltm.bw.lastVw,vh:__ltm.bw.lastVh}));
  // 1) kéo sang trái rất xa rồi kéo lại phải 150px: phải nhúc nhích ngay (không kẹt biên)
  await p.mouse.move(cx,cy); await p.mouse.down();
  for(let i=0;i<30;i++){ await p.mouse.move(cx+ i*100 ,cy); await p.waitForTimeout(16); }
  await p.waitForTimeout(80); const a=await st();
  for(let i=0;i<10;i++){ await p.mouse.move(cx+3000-i*15,cy); await p.waitForTimeout(16); }
  await p.mouse.up(); await p.waitForTimeout(120); const b2=await st();
  if(a.x>1) fails.push(`${royale?'QH':'solo'}${mi}: không chạm biên trái (camX=${a.x|0})`);
  if(!(b2.x>a.x+20)) fails.push(`${royale?'QH':'solo'}${mi}: kẹt biên — kéo ngược không nhúc nhích (${a.x|0}→${b2.x|0})`);
  // 2) kéo đến biên phải và biên dưới/trên
  await p.mouse.move(cx,cy); await p.mouse.down(); for(let i=0;i<40;i++){ await p.mouse.move(cx-i*100,cy); await p.waitForTimeout(12);} await p.mouse.up(); await p.waitForTimeout(100);
  const r=await st(); const maxX=r.W-r.vw/r.sc;
  if(Math.abs(r.x-maxX)>3) fails.push(`${royale?'QH':'solo'}${mi}: không chạm biên phải (camX=${r.x|0}, max=${maxX|0})`);
  // 3) thu phóng quanh một điểm: điểm dưới ngón phải đứng yên (không trôi)
  await p.evaluate(()=>{ __ltm.bw.zoomAt(2.0, 300, 200); });
  await p.waitForTimeout(60);
  const w1=await p.evaluate(()=>{const bw=__ltm.bw; return [bw.camX+300/bw.scale, bw.camY+200/bw.scale];});
  await p.waitForTimeout(600);
  const w2=await p.evaluate(()=>{const bw=__ltm.bw; return [bw.camX+300/bw.scale, bw.camY+200/bw.scale];});
  if(Math.hypot(w1[0]-w2[0],w1[1]-w2[1])>4) fails.push(`${royale?'QH':'solo'}${mi}: trôi khi zoom (${(w2[0]-w1[0])|0},${(w2[1]-w1[1])|0})`);
}
console.log('maps tested:', n, '| failures:', fails.length? fails : 'none');
console.log('errors', errs.length?errs:'none');
await b.close();
