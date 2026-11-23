import { chromium, devices } from 'playwright';
const {defaultBrowserType, ...o}=devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1600);
await p.evaluate(()=>window.__ltm.startBigWar(3)); await p.waitForTimeout(500);
await p.evaluate(()=>{ const bw=__ltm.bw; for(let k=0;k<40*60;k++) bw.update(1/60); bw.camX=250; });
await p.waitForTimeout(400);
await p.screenshot({path:'/tmp/bw_art1.png'});
await p.evaluate(()=>{ const bw=__ltm.bw; // ép 1 trận dã chiến giữa rừng để xem FX
  let fx=null; outer: for(let x=600;x<4400;x+=50) for(let y=260;y<1000;y+=50){ if(bw.terAt(x,y)==='forest'){ fx=[x,y]; break outer; } }
  bw.armies.push({owner:0,type:'spear',count:800,x:fx[0]-40,y:fx[1],to:-1,tx:fx[0]+90,ty:fx[1],trail:0});
  bw.armies.push({owner:1,type:'cavalry',count:700,x:fx[0]+40,y:fx[1],to:-1,tx:fx[0]-90,ty:fx[1],trail:0});
  for(let k=0;k<30;k++) bw.update(1/60);
  const r=document.getElementById('game').getBoundingClientRect(); const viewW=r.width/bw.scale;
  bw.camX=Math.max(0,fx[0]-viewW/2); bw.followT=0; });
await p.waitForTimeout(120);
await p.screenshot({path:'/tmp/bw_art2.png'});
await b.close();
