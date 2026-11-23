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
    // chờ tới khi phần tử HIỆN ra (tối đa ms) — dùng cho các khẳng định "màn X hiện lên", không phụ thuộc máy thử nhanh hay chậm
    async vis(sel,ms=7000){ const t0=Date.now(); for(;;){ if(await T.visible(sel)) return true; if(Date.now()-t0>ms) return false; await p.waitForTimeout(120); } },
    ev:(fn,arg)=>p.evaluate(fn,arg),
    // ghi lại mọi dòng chữ game vẽ lên canvas (để kiểm "người chơi có NHÌN THẤY không", kèm vị trí và cỡ chữ trên màn hình)
    async hookDraw(){ await p.evaluate(()=>{ if(window.__hk2) return; window.__hk2=1; const P=CanvasRenderingContext2D.prototype, ft=P.fillText; window.__txt=[];
      P.fillText=function(t,x,y){ if(this.canvas.id==='game'){ const tr=this.getTransform(), k=this.canvas.width/this.canvas.getBoundingClientRect().width; window.__txt.push({t:String(t),x:(x*tr.a+tr.e)/k,y:(y*tr.d+tr.f)/k,f:parseFloat((this.font.match(/([\d.]+)px/)||[0,0])[1])*Math.abs(tr.a)/k}); if(window.__txt.length>6000) window.__txt.splice(0,3000); } return ft.apply(this,arguments); }; }); },
    // các dòng chữ vừa được vẽ (trong ~160ms) khớp biểu thức; chỉ lấy chữ nằm trong màn hình
    async drawn(re){ await p.evaluate(()=>{ window.__txt.length=0; }); await p.waitForTimeout(170);
      return p.evaluate((src)=>{ const re=new RegExp(src), seen=new Set(), out=[]; for(const e of window.__txt){ if(!re.test(e.t)||e.x<-2||e.y<-2||e.x>innerWidth+2||e.y>innerHeight+2) continue; const k=e.t+'|'+Math.round(e.x/3)+'|'+Math.round(e.y/3); if(seen.has(k)) continue; seen.add(k); out.push(e); } return out; },re.source); },
    // chờ máy quay đứng yên (2 lần đo liền nhau trùng nhau) rồi mới tính toạ độ chạm — máy thử đang bận thì khung hình chậm, máy quay dừng muộn hơn
    async settle(ms=3000){ const t0=Date.now(); let last=''; for(;;){ const cur=await p.evaluate(()=>new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(()=>{ const bw=__ltm.bw; res(bw? [bw.camX.toFixed(1),(bw.camY||0).toFixed(1),bw.scale.toFixed(4)].join(',') : ''); })))); if(cur===last||Date.now()-t0>ms) return; last=cur; await p.waitForTimeout(60); } },
    // chờ tới khi điều kiện đúng (tối đa ms) — thay cho "ngủ cứng", để máy thử đang bận cũng không báo lỗi oan
    async until(fn,arg,ms=4000){ const t0=Date.now(); for(;;){ const v=await p.evaluate(fn,arg); if(v||Date.now()-t0>ms) return v; await p.waitForTimeout(100); } },
    // toạ độ màn hình của một điểm trên bản đồ
    scr:(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw, sc=bw.scale; return [(wx-bw.camX)*sc,(wy-(bw.camY||0))*sc]; },[wx,wy]),   // bw.scale đã gồm cả zoom
    // đưa một điểm bản đồ vào giữa màn hình (để chạm vào không vướng HUD)
    center:(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; bw.camX=wx-bw.lastVw/bw.scale/2; bw.camY=wy-bw.lastVh/bw.scale/2; },[wx,wy]),
    // như người chơi kéo bản đồ cho mục tiêu ra chỗ trống (không nằm dưới thông báo/nút HUD) rồi mới chạm: trả toạ độ màn hình
    aim:(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw, R=Object.values(bw.hudRects()), vw=bw.lastVw, vh=bw.lastVh;
      const free=(x,y)=>!R.some(r=>x>=r.x-26&&x<=r.x+r.w+26&&y>=r.y-26&&y<=r.y+r.h+26);
      const spots=[[0.5,0.5],[0.5,0.62],[0.6,0.6],[0.42,0.66],[0.62,0.45],[0.5,0.74],[0.7,0.7],[0.35,0.75],[0.55,0.82]];
      for(const [fx,fy] of spots){ const x=vw*fx, y=vh*fy; if(free(x,y)){ bw.camX=wx-x/bw.scale; bw.camY=wy-y/bw.scale; return [x,y]; } }
      bw.camX=wx-vw/bw.scale/2; bw.camY=wy-vh/bw.scale/2; return [vw/2,vh/2]; },[wx,wy]),
    async startBattle(cfg,lv){ await p.evaluate(([cfg,lv])=>{ G.bwCfg=cfg; startBigWar(lv); __ltm.bw.intro=null; },[cfg||{},lv||1]); await p.waitForTimeout(350); },
  };
  return T; }
