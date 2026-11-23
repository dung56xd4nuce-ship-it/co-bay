// Thư viện dùng chung cho bộ kiểm thử "như người chơi": mở game trên máy giả lập Android + iOS, chạm thật qua CDP,
// đếm PASS/FAIL và trả mã thoát khác 0 khi có lỗi (để cổng phát hành test/gate.mjs chặn bản lỗi).
import { chromium, devices } from 'playwright';
export const URL=process.argv.find(a=>a.startsWith('http'))||'http://localhost:8766/index.html';
export const DEVICES=[ ['Android · Pixel 7 ngang',devices['Pixel 7 landscape']], ['iOS · iPhone 14 Pro ngang',devices['iPhone 14 Pro landscape']] ];
export const PORTRAIT=[ ['Android · Pixel 7 dọc',devices['Pixel 7']], ['iOS · iPhone 14 Pro dọc',devices['iPhone 14 Pro']] ];
let pass=0, fail=0; const fails=[];
export const ok=(c,m)=>{ if(c){ pass++; if(process.argv.includes('-v')) console.log('  ✓ '+m); } else { fail++; fails.push(m); console.log('  ✗ FAIL '+m); } return !!c; };
export const summary=(name)=>{ console.log(`${fail?'✗':'✓'} ${name}: ${pass} đạt, ${fail} lỗi`); return fail; };
export const finish=async(name,browser)=>{ const f=summary(name); if(browser) await browser.close(); process.exit(f?1:0); };
export async function launch(){ return chromium.launch(); }
// mở 1 trang game trên 1 máy; trả {ctx,p,errs,cdp,touch...}
export async function open(browser,dev,opts={}){
  const ctx=await browser.newContext({...dev,...(opts.ctx||{})}); const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/favicon|Failed to load resource/.test(m.text())) errs.push('console: '+m.text()); });
  await p.goto(opts.url||URL); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu'),null,{timeout:15000}); await p.waitForTimeout(400);
  const cdp=await ctx.newCDPSession(p);
  const T={ctx,p,errs,cdp,
    // chạm thật (touchstart→touchend) tại toạ độ màn hình
    async tap(x,y,hold=40){ await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]}); await p.waitForTimeout(hold); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(60); },
    async drag(x0,y0,x1,y1,steps=10,holdMs=0){ await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:y0,id:1}]}); if(holdMs) await p.waitForTimeout(holdMs);
      for(let i=1;i<=steps;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+(x1-x0)*i/steps,y:y0+(y1-y0)*i/steps,id:1}]}); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(80); },
    async pinch(cx,cy,d0,d1,steps=10){ const pts=(d)=>[{x:cx-d/2,y:cy,id:1},{x:cx+d/2,y:cy,id:2}];
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts(d0)});
      for(let i=1;i<=steps;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts(d0+(d1-d0)*i/steps)}); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(80); },
    // chạm vào phần tử HTML đang hiện (nút menu, hộp thoại)
    async tapEl(sel){ const r=await p.evaluate((sel)=>{ const e=document.querySelector(sel); if(!e) return null; const b=e.getBoundingClientRect(); const cs=getComputedStyle(e);
        if(!b.width||!b.height||cs.display==='none'||cs.visibility==='hidden') return null; const cx=b.left+b.width/2, cy=b.top+b.height/2; const top=document.elementFromPoint(cx,cy);
        return {x:cx,y:cy,covered:!(top===e||e.contains(top)||top&&top.contains(e)),by:top? (top.id||top.className||top.tagName):''}; },sel);
      if(!r) return {ok:false,why:'không hiện'}; if(r.covered) return {ok:false,why:'bị che bởi '+r.by};
      await T.tap(r.x,r.y); return {ok:true}; },
    visible:(sel)=>p.evaluate((sel)=>{ const e=document.querySelector(sel); if(!e) return false; const b=e.getBoundingClientRect(), cs=getComputedStyle(e); return !!(b.width&&b.height)&&cs.display!=='none'&&cs.visibility!=='hidden'&&!e.closest('.hidden'); },sel),
    ev:(fn,arg)=>p.evaluate(fn,arg),
    // toạ độ màn hình của một điểm trên bản đồ
    scr:(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw, sc=bw.scale*bw.zoom; return [(wx-bw.camX)*sc,(wy-(bw.camY||0))*sc]; },[wx,wy]),
    async startBattle(cfg,lv){ await p.evaluate(([cfg,lv])=>{ G.bwCfg=cfg; startBigWar(lv); __ltm.bw.intro=null; },[cfg||{},lv||1]); await p.waitForTimeout(350); },
  };
  return T; }
