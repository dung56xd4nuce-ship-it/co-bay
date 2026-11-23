import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const R=[]; const ok=(c,m)=>{ R.push(c?1:0); if(!c) console.log('FAIL',m); };
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500);
const tapEl=async(id)=>{ const r=await p.evaluate((id)=>{ const el=document.getElementById(id); const r2=el.getBoundingClientRect(); return [r2.x+r2.width/2,r2.y+r2.height/2]; },id); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(350); };
await tapEl('bBW'); await tapEl('bBoss1v1'); await p.waitForTimeout(500);
await p.evaluate(()=>{ const bw=__ltm.bw; bw.nextAI=1e9; bw.nextWaveF={1:1e9}; bw.nextAiScout=1e9;
  const x0=BW.W*0.3, y0=BW.H*0.5;
  for(const [dx,dy,t] of [[0,0,'spear'],[180,60,'archer'],[-160,-70,'saber']])
    bw.armies.push({owner:0,type:t,count:300,x:x0+dx,y:y0+dy,to:-1,trail:0,camped:true,ambush:true,food:100}); });
const scr=async(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; const r=document.getElementById('game').getBoundingClientRect();
  const sc=bw.scale; bw.camX=Math.max(0,Math.min(BW.W-r.width/sc,wx-r.width/sc/2)); bw.camY=Math.max(0,Math.min(Math.max(0,BW.H-r.height/sc),wy-r.height/sc/2)); bw.followT=0;
  return [(wx-bw.camX)*sc+r.left,(wy-bw.camY)*sc+r.top]; },[wx,wy]);
const P0=await p.evaluate(()=>[BW.W*0.3,BW.H*0.5]);
// 1) đúp NHỊP CHẬM 550ms
let t=await scr(P0[0],P0[1]);
await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(550); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(300);
ok(await p.evaluate(()=>__ltm.bw.selG&&__ltm.bw.selG.length===3), '👥 Đúp nhịp chậm 550ms chọn cả cụm 3');
// 2) chạm sang thành viên khác -> cụm giữ nguyên
let t2=await scr(P0[0]+180,P0[1]+60); await p.touchscreen.tap(t2[0],t2[1]); await p.waitForTimeout(250);
ok(await p.evaluate(()=>__ltm.bw.selG&&__ltm.bw.selG.length===3), '👥 Chạm thành viên khác: cụm vẫn 3');
// 3) lệnh cụm mai phục về chính TRẠI TA (luật mai phục không nuốt)
const camp=await p.evaluate(()=>[__ltm.bw.nodes[0].x,__ltm.bw.nodes[0].y]);
t=await scr(camp[0],camp[1]); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(280);
let mi=await p.evaluate(()=>{ const r=(__ltm.bw._menuRects||[]).find(r2=>r2.id==='move'); const g=document.getElementById('game').getBoundingClientRect(); return r?[g.left+r.x+r.w/2,g.top+r.y+r.h/2]:null; });
if(mi){ await p.touchscreen.tap(mi[0],mi[1]); await p.waitForTimeout(300); }
ok(await p.evaluate(()=>__ltm.bw.armies.filter(a=>a.owner===0&&!a.done&&a.to===0&&!a.camped).length===3), '👥 CẢ 3 đạo mai phục cùng nhận lệnh về trại');
// 4) HỢP BINH sau thắng dã chiến
await p.evaluate(()=>{ const bw=__ltm.bw; const x0=BW.W*0.42,y0=BW.H*0.5;
  bw.armies.length=0;
  bw.armies.push({owner:0,type:'spear',count:700,x:x0,y:y0,to:-1,tx:x0+1,ty:y0,trail:0,food:80});
  bw.armies.push({owner:1,type:'saber',count:900,x:x0+45,y:y0,to:-1,tx:x0-1,ty:y0,trail:0,food:60});
  for(let k=0;k<40;k++) bw.update(1/60);
  bw.armies.push({owner:0,type:'archer',count:500,x:x0-280,y:y0,to:-1,tx:x0,ty:y0,trail:0,food:90});
  for(let k=0;k<200*60;k++){ bw.update(1/60); if(!bw.battles.some(b2=>!b2.done)) break; } });
const mg=await p.evaluate(()=>{ const al=__ltm.bw.armies.filter(a=>a.owner===0&&!a.done&&a.count>0); return {n:al.length,c:al[0]&&Math.round(al[0].count)}; });
ok(mg.n===1&&mg.c>350, `🤝 Thắng trận tự HỢP BINH còn 1 đạo ${mg.c} quân`);
await p.screenshot({path:`test/${which}-v22.png`});
// 5) fps map lớn + quần hùng 36
await p.evaluate(()=>{ window.__ltm.G.bw=null; document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden')); document.getElementById('menu').classList.remove('hidden'); });
await tapEl('bBW'); await tapEl('bBossRoyale'); await p.waitForTimeout(800);
await p.evaluate(()=>{ for(let k=0;k<25*60;k++) __ltm.bw.update(1/60); }); await p.waitForTimeout(4000);
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const lp=()=>{ n++; if(performance.now()-t0<2500) requestAnimationFrame(lp); else res(Math.round(n/2.5)); }; requestAnimationFrame(lp); }));
const camps=await p.evaluate(()=>__ltm.bw.nodes.filter(n=>n.camp).length);
ok(fps>=40, `⚡ Quần hùng ${camps} nước trên map ${await p.evaluate(()=>BW.W+'x'+BW.H)}: ${fps}fps`);
await p.screenshot({path:`test/${which}-royale2.png`});
console.log(which, R.filter(x=>x).length+'/'+R.length,'PASS | fps',fps,'| errors',errs.slice(0,2));
await b.close();
