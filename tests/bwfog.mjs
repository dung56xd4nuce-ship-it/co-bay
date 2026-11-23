import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1400);
// 1) menu chỉ còn Đại Chiến
const menu=await p.evaluate(()=>[...document.querySelectorAll('.menuBtns .btn')].filter(x=>x.offsetParent&&getComputedStyle(x).display!=='none').map(x=>x.textContent.trim()));
// 2) vào Đại Chiến bằng chạm nút thật
const bb=await p.evaluate(()=>{ const r=document.getElementById('bBW').getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2]; });
await p.touchscreen.tap(bb[0],bb[1]); await p.waitForTimeout(700);
const st=await p.evaluate(()=>{ const bw=__ltm.bw; const far=bw.nodes.filter(n=>n.owner===1&&!bw.visNow(n)&&n.count>0);
  return { lv:bw.lv, fogged:far.length, ters:[...new Set(bw.nodes.map(n=>n.ter))], tgt: far.length? far[0].id:-1 }; });
// 3) chạm node trong sương -> do thám
let scout=null;
if(st.tgt>=0){
  const pos=await p.evaluate((id)=>{ const bw=__ltm.bw,n=bw.nodes[id]; const r=document.getElementById('game').getBoundingClientRect();
    const viewW=r.width/bw.scale; bw.camX=Math.max(0,Math.min(BW.W-viewW,n.x-viewW/2)); bw.followT=0;
    return [(n.x-bw.camX)*bw.scale+r.left,(n.y)*bw.scale+r.top]; }, st.tgt);
  await p.touchscreen.tap(pos[0],pos[1]); await p.waitForTimeout(250);
  scout=await p.evaluate(()=>({n:__ltm.bw.scouts.length}));
  // chờ do thám tới nơi
  await p.evaluate(()=>{ for(let k=0;k<40*60;k++){ if(!__ltm.bw.scouts.length) break; __ltm.bw.update(1/60);} });
  scout.revealed=await p.evaluate((id)=>__ltm.bw.visNow(__ltm.bw.nodes[id]) && !!__ltm.bw.nodes[id].known, st.tgt);
}
await p.screenshot({path:`test/${which}-fog.png`});
// 4) camera không trôi: không ra lệnh, đợi 4 giây thật
const cam0=await p.evaluate(()=>__ltm.bw.camX); await p.waitForTimeout(4000);
const cam1=await p.evaluate(()=>__ltm.bw.camX);
console.log(which, JSON.stringify({menu, lv:st.lv, fogged:st.fogged, ters:st.ters, scout, camDrift:Math.abs(cam1-cam0)}), 'errors', errs);
await b.close();
