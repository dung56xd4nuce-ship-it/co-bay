// v2.4: KHÔNG còn trôi màn hình + ⛶ toàn màn hình
import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const R=[]; const ok=(c,m)=>{ R.push(c?1:0); if(!c) console.log('FAIL',m); };
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500);
const tapEl=async(id)=>{ const r=await p.evaluate((id)=>{ const el=document.getElementById(id); const r2=el.getBoundingClientRect(); return [r2.x+r2.width/2,r2.y+r2.height/2]; },id); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(350); };
// ⛶ từ menu chính
await tapEl('bFull'); await p.waitForTimeout(500);
const fs1=await p.evaluate(()=>!!(document.fullscreenElement||document.webkitFullscreenElement));
ok(fs1, '⛶ Menu: vào TOÀN MÀN HÌNH thật (fullscreenElement đặt)');
await tapEl('bFull'); await p.waitForTimeout(400); // thoát để chơi tiếp bình thường
await tapEl('bBW'); await tapEl('bBoss1v1'); await p.waitForTimeout(500);
await p.evaluate(()=>{ const bw=__ltm.bw; bw.nextAI=1e9; bw.nextWaveF={1:1e9}; bw.nextAiScout=1e9; });
// ⛶ trong trận
await tapEl('bwFull'); await p.waitForTimeout(500);
ok(await p.evaluate(()=>!!(document.fullscreenElement||document.webkitFullscreenElement)), '⛶ Trong trận: bật toàn màn hình');
await tapEl('bwFull'); await p.waitForTimeout(400);
// KHÔNG TRÔI: ra lệnh xong, không đụng gì 5 giây -> camX/camY/zoom đứng im tuyệt đối
const scr=async(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; const r=document.getElementById('game').getBoundingClientRect();
  const sc=bw.scale; bw.camX=Math.max(0,Math.min(BW.W-r.width/sc,wx-r.width/sc/2)); bw.camY=Math.max(0,Math.min(Math.max(0,BW.H-r.height/sc),wy-r.height/sc/2));
  return [(wx-bw.camX)*sc+r.left,(wy-bw.camY)*sc+r.top]; },[wx,wy]);
const S=await p.evaluate(()=>{ const bw=__ltm.bw; const s=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.camp)||bw.nodes[0]; const dir=s.x<BW.W/2?1:-1; return [s.x,s.y,dir]; });
let t=await scr(S[0],S[1]); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(240);
t=await scr(S[0]+S[2]*420,S[1]); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(260);
const mi=await p.evaluate(()=>{ const r=(__ltm.bw._menuRects||[]).find(r2=>r2.id==='move'); const g=document.getElementById('game').getBoundingClientRect(); return r?[g.left+r.x+r.w/2,g.top+r.y+r.h/2]:null; });
await p.touchscreen.tap(mi[0],mi[1]); await p.waitForTimeout(200);
const cam0=await p.evaluate(()=>[__ltm.bw.camX,__ltm.bw.camY,__ltm.bw.zoom]);
await p.waitForTimeout(5000);
const cam1=await p.evaluate(()=>[__ltm.bw.camX,__ltm.bw.camY,__ltm.bw.zoom]);
const drift=Math.hypot(cam1[0]-cam0[0],cam1[1]-cam0[1])+Math.abs(cam1[2]-cam0[2])*100;
ok(drift<0.5, `🎥 RA LỆNH xong 5 giây không đụng gì: camera đứng im tuyệt đối (drift=${drift.toFixed(3)})`);
// kéo tay vẫn mượt
await p.touchscreen.tap(t[0],t[1]); // bỏ chọn
const g=await p.evaluate(()=>{ const r=document.getElementById('game').getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2]; });
await p.touchscreen.tap(g[0],g[1]);
console.log(which, R.filter(x=>x).length+'/'+R.length,'PASS | errors',errs.slice(0,2));
await b.close();
