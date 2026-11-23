// Ảnh chụp khung bản đồ ở góc, cạnh, thu nhỏ — cả Quần Hùng và 1v1; đo FPS
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape', tag=dev.split(' ')[0];
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(900);
for(const [mode,where,z] of [['royale','corner',1],['royale','edge',1.6],['1v1','corner',0.8],['royale','far',0.3]]){
  await p.evaluate(([mode])=>{ G.bwCfg= mode==='royale'? {royale:36,seed:91,map:2} : {map:3}; startBigWar(mode==='royale'?5:3); __ltm.bw.intro=null; },[mode]); await p.waitForTimeout(500);
  await p.evaluate(([mode,where,z])=>{ const bw=__ltm.bw; bw.notes=[];
    bw.zoom=bw.zoomTgt=z; const s=bw.scale0*z, vW=bw.lastVw/s, vH=bw.lastVh/s;
    if(where==='corner'){ bw.camX=-vW*0.35; bw.camY=-vH*0.35; } else if(where==='edge'){ bw.camX=BW.W*0.5; bw.camY=-vH*0.4; } else { bw.camX=-vW*0.1; bw.camY=-vH*0.1; } },[mode,where,z]);
  await p.waitForTimeout(700); await p.screenshot({path:`/tmp/frame_${tag}_${mode}_${where}.png`});
}
const fps=await p.evaluate(async()=>{ const bw=__ltm.bw; bw.zoom=bw.zoomTgt=1; let n=0; const t0=performance.now(); await new Promise(r=>{ const tick=()=>{ n++; bw.camX=-300+(n*20)%3000; if(performance.now()-t0<2500) requestAnimationFrame(tick); else r(); }; requestAnimationFrame(tick); }); return +(n/2.5).toFixed(1); });
console.log(dev,'FPS cuộn dọc mép:',fps,'errors',errs.length?errs:'none'); await b.close();
