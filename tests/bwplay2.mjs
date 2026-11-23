// CHƠI THỬ v2 bằng CHẠM THẬT: menu Boss, menu lệnh, trận zoom, rút lui, thông báo, quần hùng
import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const R=[]; const ok=(c,m)=>{ R.push(c?1:0); if(!c) console.log('FAIL',m); };
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1400);
const tapEl=async(id)=>{ const r=await p.evaluate((id)=>{ const el=document.getElementById(id); const r2=el.getBoundingClientRect(); return [r2.x+r2.width/2,r2.y+r2.height/2]; },id); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(350); };
// 1) menu: ĐÁNH BOSS -> chọn 1v1
await tapEl('bBW');
ok(await p.evaluate(()=>!document.getElementById('bossPick').classList.contains('hidden')), 'Menu ĐÁNH BOSS mở 2 lựa chọn');
await tapEl('bBoss1v1');
await p.waitForTimeout(500);
ok(await p.evaluate(()=>!!__ltm.bw&&!__ltm.bw.royale), 'Vào 1v1');
const scr=async(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; const r=document.getElementById('game').getBoundingClientRect();
  const sc=bw.scale; bw.camX=Math.max(0,Math.min(BW.W-r.width/sc,wx-r.width/sc/2)); bw.camY=0; bw.followT=0; bw.zoomTgt=1; bw.zoom=1;
  return [(wx-bw.camX)*sc+r.left,(wy-bw.camY)*sc+r.top]; },[wx,wy]);
const tapW=async(wx,wy)=>{ const t=await scr(wx,wy); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(260); };
// 2) MENU LỆNH: chọn node ta -> chạm node địch -> hiện menu -> chọn DO THÁM
const S=await p.evaluate(()=>{ const bw=__ltm.bw; bw.nextAI=1e9; bw.nextWaveF={1:1e9}; bw.nextAiScout=1e9;
  const s=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.camp), e=bw.nodes.find(n=>n.owner===1&&n.count>0&&!n.camp);
  return {sx:s.x,sy:s.y,ex:e.x,ey:e.y,eid:e.id}; });
await tapW(S.sx,S.sy); await tapW(S.ex,S.ey);
ok(await p.evaluate(()=>!!__ltm.bw.menu&&__ltm.bw._menuRects&&__ltm.bw._menuRects.length>=3), '📋 Menu lệnh hiện: Tấn công/Bao vây/Do thám');
const mi=await p.evaluate(()=>{ const r=__ltm.bw._menuRects.find(r2=>r2.id==='scout'); const g=document.getElementById('game').getBoundingClientRect(); return [g.left+r.x+r.w/2,g.top+r.y+r.h/2]; });
await p.touchscreen.tap(mi[0],mi[1]); await p.waitForTimeout(300);
ok(await p.evaluate(()=>__ltm.bw.scouts.length===1), '📋 Chọn DO THÁM trong menu -> toán do thám xuất phát');
// 3) TRẬN + ZOOM + RÚT LUI bằng chạm
await p.evaluate(()=>{ const bw=__ltm.bw;
  const A={owner:0,type:'spear',count:900,x:1500,y:600,to:-1,tx:1501,ty:600,trail:0,food:100};
  const B={owner:1,type:'saber',count:950,x:1545,y:600,to:-1,tx:1499,ty:600,trail:0,food:100};
  bw.armies.push(A,B); for(let k=0;k<40;k++) bw.update(1/60); });
ok(await p.evaluate(()=>__ltm.bw.battles.length===1), '⚔️ Hai đạo đối đầu mở TRẬN kéo dài');
const bpos=await p.evaluate(()=>[__ltm.bw.battles[0].x,__ltm.bw.battles[0].y]);
await tapW(bpos[0],bpos[1]);
await p.waitForTimeout(700);
ok(await p.evaluate(()=>__ltm.bw.zoomTgt>1.5), '🔍 Chạm vào trận -> ZOOM vào khu giao tranh');
// nút rút lui hiện -> chạm
await p.waitForTimeout(400);
const rb=await p.evaluate(()=>{ const r=__ltm.bw._retreatBtn; const g=document.getElementById('game').getBoundingClientRect(); return r?[g.left+r.x+r.w/2,g.top+r.y+r.h/2]:null; });
ok(!!rb, '🏳️ Nút RÚT LUI hiện khi quân ta trong trận');
await p.touchscreen.tap(rb[0],rb[1]); await p.waitForTimeout(300);
ok(await p.evaluate(()=>{ const a=__ltm.bw.armies.find(x=>x.owner===0&&!x.done&&x.to>=0); return !!a&&__ltm.bw.zoomTgt===1; }), '🏳️ Chạm RÚT LUI: quân thoát trận chạy về, màn hình thu về toàn cục');
// 4) THÔNG BÁO chạm để nhảy
await p.evaluate(()=>{ __ltm.bw.note('⚔️ Giao tranh thử!',3800,700,'⚔️'); });
await p.waitForTimeout(300);
const nr=await p.evaluate(()=>{ const r=(__ltm.bw._noteRects||[]).find(r2=>r2.nt.text.includes('thử')); const g=document.getElementById('game').getBoundingClientRect(); return r?[g.left+r.x+r.w/2,g.top+r.y+r.h/2]:null; });
ok(!!nr, '🔔 Thông báo hiện trên màn hình');
await p.touchscreen.tap(nr[0],nr[1]); await p.waitForTimeout(400);
ok(await p.evaluate(()=>__ltm.bw.zoomTgt>1.2&&__ltm.bw.camX>2200), '🔔 Chạm thông báo -> camera nhảy + zoom tới nơi xảy ra');
await p.screenshot({path:`test/${which}-v2.png`});
// 5) QUẦN HÙNG qua menu thật
await p.evaluate(()=>{ __ltm.G.bw.over=true; });
await p.evaluate(()=>{ document.getElementById('bwBack')&&document.getElementById('bwBack').click&&0; });
await p.evaluate(()=>{ window.__ltm.G.bw=null; document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden')); document.getElementById('menu').classList.remove('hidden'); });
await tapEl('bBW'); await tapEl('bBossRoyale');
await p.waitForTimeout(900);
const ry=await p.evaluate(()=>({ royale: !!__ltm.bw&&!!__ltm.bw.royale, camps: __ltm.bw? __ltm.bw.nodes.filter(n=>n.camp).length:0 }));
ok(ry.royale&&ry.camps>=30, `🌏 Vào QUẦN HÙNG từ menu (${ry.camps} nước)`);
await p.evaluate(()=>{ for(let k=0;k<30*60;k++) __ltm.bw.update(1/60); });
await p.screenshot({path:`test/${which}-royale.png`});
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const lp=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(lp); else res(Math.round(n/2)); }; requestAnimationFrame(lp); }));
console.log(which, R.filter(x=>x).length+'/'+R.length,'PASS | fps',fps,'| errors',errs.slice(0,3));
await b.close();
