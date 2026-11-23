// v2.6: ⏸ DỪNG GAME — đánh boss + P2P (dừng cả 2 máy)
import { chromium, devices } from 'playwright';
const {defaultBrowserType, ...o}=devices['Pixel 7 landscape'];
const b=await chromium.launch(); const ctx=await b.newContext(o);
const R=[]; const ok=(c,m)=>{ R.push(c?1:0); if(!c) console.log('FAIL',m); };
// ---- 1) BOSS: pause/resume trên 1 máy
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1400);
const tapEl=async(pg,id)=>{ const r=await pg.evaluate((id)=>{ const el=document.getElementById(id); const r2=el.getBoundingClientRect(); return [r2.x+r2.width/2,r2.y+r2.height/2]; },id); await pg.touchscreen.tap(r[0],r[1]); await pg.waitForTimeout(320); };
await tapEl(p,'bBW'); await tapEl(p,'bBoss1v1'); await p.waitForTimeout(500);
await tapEl(p,'bwPause');
const pz=await p.evaluate(()=>({ shown: !document.getElementById('pause').classList.contains('hidden'), t:__ltm.bw.time }));
await p.waitForTimeout(1200);
const pz2=await p.evaluate(()=>__ltm.bw.time);
ok(pz.shown&&Math.abs(pz2-pz.t)<0.01, `⏸ Boss: dừng là THỜI GIAN ĐỨNG IM (${pz.t.toFixed(2)}s giữ nguyên)`);
await tapEl(p,'bResume');
await p.waitForTimeout(900);
const pz3=await p.evaluate(()=>({h:document.getElementById('pause').classList.contains('hidden'), t:__ltm.bw.time}));
ok(pz3.h&&pz3.t>pz2+0.5, '▶ Boss: tiếp tục chạy lại bình thường');
// ---- 2) P2P: dừng từ CHỦ -> cả 2 máy dừng; KHÁCH bấm tiếp tục -> cả 2 chạy lại
const H=await ctx.newPage(), G2=await ctx.newPage();
for(const pg of [H,G2]){ await pg.goto('http://localhost:8766/index.html'); await pg.waitForTimeout(1100); }
await H.evaluate(()=>{ P2P.open(); P2P.host(); });
await H.waitForFunction(()=>document.getElementById('p2pOut').value.length>50,{timeout:15000});
const offer=await H.evaluate(()=>document.getElementById('p2pOut').value);
await G2.evaluate(()=>{ P2P.open(); P2P.join(); });
await G2.evaluate((v)=>{ document.getElementById('p2pIn').value=v; document.getElementById('p2pGo').onclick(); },offer);
await G2.waitForFunction(()=>document.getElementById('p2pOut').value.length>50,{timeout:15000});
const answer=await G2.evaluate(()=>document.getElementById('p2pOut').value);
await H.evaluate((v)=>{ document.getElementById('p2pIn').value=v; document.getElementById('p2pGo').onclick(); },answer);
await H.waitForFunction(()=>P2P.connected&&!!window.__ltm.bw,{timeout:20000});
await G2.waitForFunction(()=>P2P.connected&&!!window.__ltm.bw,{timeout:20000});
await G2.waitForTimeout(1200);
await tapEl(H,'bwPause'); await H.waitForTimeout(700);
const hp=await H.evaluate(()=>({sh:!document.getElementById('pause').classList.contains('hidden'), t:__ltm.bw.time}));
const gp=await G2.evaluate(()=>({sh:!document.getElementById('pause').classList.contains('hidden'), t:__ltm.bw.time}));
ok(hp.sh&&gp.sh, '⏸ P2P: CHỦ bấm dừng — màn dừng hiện trên CẢ HAI MÁY');
await H.waitForTimeout(1200);
const ht2=await H.evaluate(()=>__ltm.bw.time), gt2=await G2.evaluate(()=>__ltm.bw.time);
ok(Math.abs(ht2-hp.t)<0.01&&Math.abs(gt2-gp.t)<0.01, '⏸ P2P: thời gian trận ĐÓNG BĂNG trên cả hai máy');
await tapEl(G2,'bResume'); await G2.waitForTimeout(1100);
const hr=await H.evaluate(()=>({h:document.getElementById('pause').classList.contains('hidden'),t:__ltm.bw.time}));
const gr=await G2.evaluate(()=>({h:document.getElementById('pause').classList.contains('hidden'),t:__ltm.bw.time}));
ok(hr.h&&gr.h&&hr.t>ht2+0.4, '▶ P2P: KHÁCH bấm tiếp tục — cả hai máy chạy lại');
console.log(R.filter(x=>x).length+'/'+R.length,'PASS | errors',errs.slice(0,2));
await b.close();
