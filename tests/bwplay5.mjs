// v2.3: "Thôi" hủy chọn + thu phóng chủ động (nút ➕➖, chụm 2 ngón, con lăn)
import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const R=[]; const ok=(c,m)=>{ R.push(c?1:0); if(!c) console.log('FAIL',m); };
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500);
const tapEl=async(id)=>{ const r=await p.evaluate((id)=>{ const el=document.getElementById(id); const r2=el.getBoundingClientRect(); return [r2.x+r2.width/2,r2.y+r2.height/2]; },id); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(350); };
await tapEl('bBW'); await tapEl('bBoss1v1'); await p.waitForTimeout(500);
await p.evaluate(()=>{ const bw=__ltm.bw; bw.nextAI=1e9; bw.nextWaveF={1:1e9}; bw.nextAiScout=1e9; });
const scr=async(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; const r=document.getElementById('game').getBoundingClientRect();
  const sc=bw.scale; bw.camX=Math.max(0,Math.min(BW.W-r.width/sc,wx-r.width/sc/2)); bw.camY=Math.max(0,Math.min(Math.max(0,BW.H-r.height/sc),wy-r.height/sc/2)); bw.followT=0;
  return [(wx-bw.camX)*sc+r.left,(wy-bw.camY)*sc+r.top]; },[wx,wy]);
// 1) CHỌN QUÂN -> chạm đất -> menu -> "✖ Thôi" => HỦY CHỌN HOÀN TOÀN
const S=await p.evaluate(()=>{ const bw=__ltm.bw; const s=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.camp)||bw.nodes[0]; const dir=s.x<BW.W/2?1:-1; return [s.x,s.y,dir]; });
let t=await scr(S[0],S[1]); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(240);
t=await scr(S[0]+S[2]*420,S[1]); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(280);
const mi=await p.evaluate(()=>{ const r=(__ltm.bw._menuRects||[]).find(r2=>r2.id==='cancel'); const g=document.getElementById('game').getBoundingClientRect(); return r?[g.left+r.x+r.w/2,g.top+r.y+r.h/2]:null; });
ok(!!mi, '📋 Menu có nút ✖ Thôi');
await p.touchscreen.tap(mi[0],mi[1]); await p.waitForTimeout(250);
ok(await p.evaluate(()=>!__ltm.bw.sel&&!__ltm.bw.selA&&!__ltm.bw.menu), '✖ Chọn THÔI là HỦY CHỌN hẳn');
// chạm đất tiếp theo KHÔNG mở menu lệnh (vì không còn gì được chọn)
t=await scr(S[0]+S[2]*600,S[1]+80); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(250);
ok(await p.evaluate(()=>!__ltm.bw.menu&&__ltm.bw.armies.filter(a=>a.owner===0&&!a.done&&!a.camped).length===0), '✖ Sau Thôi, chạm đất không ra lệnh/menu gì nữa');
// chạm RA NGOÀI menu cũng bỏ chọn
t=await scr(S[0],S[1]); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(220);
t=await scr(S[0]+S[2]*420,S[1]); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(260);
await p.touchscreen.tap(30,300); await p.waitForTimeout(220); // góc trống màn hình
ok(await p.evaluate(()=>!__ltm.bw.menu&&!__ltm.bw.sel&&!__ltm.bw.selA), '✖ Chạm ra ngoài menu: đóng menu + bỏ chọn');
// 2) NÚT ➕ ➖
const z0=await p.evaluate(()=>__ltm.bw.zoomTgt);
const zb=await p.evaluate(()=>{ const g=document.getElementById('game').getBoundingClientRect(); return __ltm.bw._zBtns.map(r=>[g.left+r.x+r.w/2,g.top+r.y+r.h/2]); });
await p.touchscreen.tap(zb[0][0],zb[0][1]); await p.waitForTimeout(250);
const z1=await p.evaluate(()=>__ltm.bw.zoomTgt);
await p.touchscreen.tap(zb[1][0],zb[1][1]); await p.waitForTimeout(150); await p.touchscreen.tap(zb[1][0],zb[1][1]); await p.waitForTimeout(250);
const z2=await p.evaluate(()=>__ltm.bw.zoomTgt);
ok(z1>z0&&z2<z1, `➕➖ Nút thu phóng chạy (1.0 → ${z1.toFixed(2)} → ${z2.toFixed(2)})`);
ok(z2>=0.69, '➖ Thu nhỏ được xuống mức nhìn bao quát (0.7x)');
// 3) CHỤM 2 NGÓN (phát sự kiện pointer thật trên canvas)
const pz=await p.evaluate(()=>new Promise(res=>{ const bw=__ltm.bw; const cv=document.getElementById('game'); const r=cv.getBoundingClientRect();
  const before=bw.zoomTgt;
  const mk=(id,x,y,type)=>{ const ev=new PointerEvent(type,{pointerId:id,clientX:r.left+x,clientY:r.top+y,bubbles:true,pointerType:'touch',isPrimary:id===1}); cv.dispatchEvent(ev); };
  mk(1,300,200,'pointerdown'); mk(2,420,200,'pointerdown');
  let sp=60; const step=(k)=>{ if(k>=8){ mk(1,300-sp,200,'pointerup'); mk(2,420+sp,200,'pointerup'); res([before,bw.zoomTgt]); return; }
    sp=60+k*18; mk(1,300-sp,200,'pointermove'); mk(2,420+sp,200,'pointermove'); setTimeout(()=>step(k+1),16); };
  setTimeout(()=>step(0),16); }));
ok(pz[1]>pz[0]*1.15, `🤏 Chụm 2 ngón phóng to (${pz[0].toFixed(2)} → ${pz[1].toFixed(2)})`);
await p.screenshot({path:`test/${which}-zoomui.png`});
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const lp=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(lp); else res(Math.round(n/2)); }; requestAnimationFrame(lp); }));
console.log(which, R.filter(x=>x).length+'/'+R.length,'PASS | fps',fps,'| errors',errs.slice(0,2));
await b.close();
