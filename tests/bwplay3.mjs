import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const R=[]; const ok=(c,m)=>{ R.push(c?1:0); if(!c) console.log('FAIL',m); };
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500);
const tapEl=async(id)=>{ const r=await p.evaluate((id)=>{ const el=document.getElementById(id); const r2=el.getBoundingClientRect(); return [r2.x+r2.width/2,r2.y+r2.height/2]; },id); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(350); };
await tapEl('bBW'); await tapEl('bBoss1v1'); await p.waitForTimeout(500);
ok(await p.evaluate(()=>!!__ltm.bw&&!!__ltm.bw.mapName), 'Vào trận, có tên bản đồ: '+await p.evaluate(()=>__ltm.bw.mapName));
await p.evaluate(()=>{ const bw=__ltm.bw; bw.nextAI=1e9; bw.nextWaveF={1:1e9}; bw.nextAiScout=1e9; });
// 1) RÚT LUI bằng chạm: tạo trận, zoom, bấm rút lui -> quân PHẢI thoát hẳn và chạy về trại
await p.evaluate(()=>{ const bw=__ltm.bw;
  const A={owner:0,type:'spear',count:900,x:1600,y:600,to:-1,tx:1601,ty:600,trail:0,food:100};
  const B={owner:1,type:'saber',count:2400,x:1645,y:600,to:-1,tx:1599,ty:600,trail:0,food:100};
  bw.armies.push(A,B); for(let k=0;k<40;k++) bw.update(1/60); });
const scr=async(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; const r=document.getElementById('game').getBoundingClientRect();
  const sc=bw.scale; bw.camX=Math.max(0,Math.min(BW.W-r.width/sc,wx-r.width/sc/2)); bw.camY=Math.max(0,Math.min(Math.max(0,BW.H-r.height/sc),wy-r.height/sc/2)); bw.followT=0;
  return [(wx-bw.camX)*sc+r.left,(wy-bw.camY)*sc+r.top]; },[wx,wy]);
const bpos=await p.evaluate(()=>[__ltm.bw.battles[0].x,__ltm.bw.battles[0].y]);
let t=await scr(bpos[0],bpos[1]); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(900);
ok(await p.evaluate(()=>__ltm.bw.zoomTgt>2.3), '🔍 Zoom trận LỚN (2.6x)');
const rb=await p.evaluate(()=>{ const r=__ltm.bw._retreatBtn; const g=document.getElementById('game').getBoundingClientRect(); return r?[g.left+r.x+r.w/2,g.top+r.y+r.h/2]:null; });
await p.touchscreen.tap(rb[0],rb[1]); await p.waitForTimeout(400);
const ret=await p.evaluate(()=>{ const a=__ltm.bw.armies.find(x=>x.owner===0&&!x.done); return a?{btl:a.btl,to:a.to,retT:a.retreatT}:null; });
ok(ret&&!ret.btl&&ret.to===0&&ret.retT>0, '🏳️ RÚT LUI: thoát trận, miễn chiến, chạy VỀ TRẠI (to=0)');
let sucked=false; for(let k=0;k<6;k++){ await p.waitForTimeout(300); if(await p.evaluate(()=>{ const a=__ltm.bw.armies.find(x=>x.owner===0&&!x.done); return a&&!!a.btl; })) sucked=true; }
ok(!sucked, '🏳️ KHÔNG bị cuốn lại vào trận sau khi rút (lỗi cũ)');
// 2) vạch LƯƠNG hiển thị trên đạo quân — chụp màn hình soát mắt
const army=await p.evaluate(()=>{ const a=__ltm.bw.armies.find(x=>x.owner===0&&!x.done); return a?[a.x,a.y]:null; });
if(army){ await scr(army[0],army[1]); }
await p.waitForTimeout(300); await p.screenshot({path:`test/${which}-food.png`});
// 3) BAO VÂY dàn vòng vây: lệnh siege qua menu thật
const sg=await p.evaluate(()=>{ const bw=__ltm.bw; const s=bw.nodes.find(n=>n.owner===0&&n.count>400)||bw.nodes[0]; s.count=Math.max(800,s.count);
  const e=bw.nodes.find(n=>n.owner===1&&n.count>0&&!n.camp); return {sx:s.x,sy:s.y,ex:e.x,ey:e.y,eid:e.id}; });
t=await scr(sg.sx,sg.sy); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(220);
t=await scr(sg.ex,sg.ey); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(260);
const mi=await p.evaluate(()=>{ const r=(__ltm.bw._menuRects||[]).find(r2=>r2.id==='siege'); const g=document.getElementById('game').getBoundingClientRect(); return r?[g.left+r.x+r.w/2,g.top+r.y+r.h/2]:null; });
await p.touchscreen.tap(mi[0],mi[1]); await p.waitForTimeout(250);
// tua cho tới nơi + dàn vây
await p.evaluate(()=>{ const bw=__ltm.bw; for(let k=0;k<200*60;k++){ bw.update(1/60); const a=bw.armies.find(x=>x.owner===0&&x.sieging!=null&&x.camped); if(a) break; } });
const sieged=await p.evaluate((eid)=>{ const bw=__ltm.bw; const a=bw.armies.find(x=>x.owner===0&&x.sieging===eid&&x.camped); for(let k=0;k<6;k++) bw.update(5); return {ok:!!a, nodeSieged: bw.nodes[eid].sieged===true, ax:a&&a.x, ay:a&&a.y}; },sg.eid);
ok(sieged.ok&&sieged.nodeSieged, '⛓️ BAO VÂY qua menu: quân dàn vành đai, thành bị cắt tiếp tế');
await scr(sg.ex,sg.ey); await p.waitForTimeout(250); await p.screenshot({path:`test/${which}-siege.png`});
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const lp=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(lp); else res(Math.round(n/2)); }; requestAnimationFrame(lp); }));
console.log(which, R.filter(x=>x).length+'/'+R.length,'PASS | fps',fps,'| errors',errs.slice(0,2));
await b.close();
