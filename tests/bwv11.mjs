import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1400);
const bb=await p.evaluate(()=>{ const r=document.getElementById('bBW').getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2]; });
await p.touchscreen.tap(bb[0],bb[1]); await p.waitForTimeout(600);
// toạ độ màn hình của 1 điểm thế giới
const scr=async(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; const r=document.getElementById('game').getBoundingClientRect();
  const viewW=r.width/bw.scale; bw.camX=Math.max(0,Math.min(BW.W-viewW,wx-viewW/2)); bw.followT=0;
  return [(wx-bw.camX)*bw.scale+r.left, wy*bw.scale+r.top]; },[wx,wy]);
// 1) chọn node ta, chạm điểm rừng trống -> hành quân, tới nơi tự mai phục
const info=await p.evaluate(()=>{ const bw=__ltm.bw; const s=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.camp)||bw.nodes[0];
  let fx=null; outer: for(let x=s.x+150;x<BW.W;x+=50) for(let y=230;y<BW.H-80;y+=50){
    if(bw.terAt(x,y)==='forest' && !bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<140)){ fx=[x,y]; break outer; } }
  return {sid:s.id, sx:s.x, sy:s.y, fx}; });
let t1=await scr(info.sx,info.sy); await p.touchscreen.tap(t1[0],t1[1]); await p.waitForTimeout(200);
let t2=await scr(info.fx[0],info.fx[1]); await p.touchscreen.tap(t2[0],t2[1]); await p.waitForTimeout(200);
const march=await p.evaluate(()=>{ const a=__ltm.bw.armies.find(a=>a.owner===0&&a.to===-1&&!a.hunt); return a? {to:a.to}:null; });
await p.evaluate(()=>{ const bw=__ltm.bw; for(let k=0;k<240*60&&!bw.armies.some(a=>a.owner===0&&a.camped);k++) bw.update(1/60); });
const camp=await p.evaluate(()=>{ const a=__ltm.bw.armies.find(a=>a.owner===0&&a.camped); return a? {camped:true,ambush:!!a.ambush}:null; });
// 2) chạm đạo quân đã đóng -> chọn; chạm đạo địch -> truy kích
const hunt=await p.evaluate(()=>{ const bw=__ltm.bw; const a=bw.armies.find(x=>x.owner===0&&x.camped); if(!a) return null;
  const foe={owner:1,type:'archer',count:200,x:a.x+220,y:a.y,to:-1,tx:a.x+240,ty:a.y,trail:0}; bw.armies.push(foe);
  bw.tap(a.x,a.y); const selOK=bw.selA===a;
  bw.tap(foe.x,foe.y); return {selOK, hunting: a.hunt===foe}; });
await p.screenshot({path:`test/${which}-v11.png`});
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const lp=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(lp); else res(Math.round(n/2)); }; requestAnimationFrame(lp); }));
console.log(which, JSON.stringify({march:!!march, camp, hunt, fps}), 'errors', errs);
await b.close();
