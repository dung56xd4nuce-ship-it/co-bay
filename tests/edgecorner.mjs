// Tình huống trong video: trại/quân ta ở GÓC trên-trái bản đồ, bị các nút 🏠↻⏸⛶ đè.
// Người chơi kéo bản đồ (ngón tay thật) vượt mép vào vùng tối để đưa trại ra giữa, rồi chạm chọn quân.
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape', tag=dev.split(' ')[0];
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); const cdp=await ctx.newCDPSession(p);
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const {width:W,height:H}=p.viewportSize(); const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
const drag=async(x0,y0,dx,dy)=>{ await T('touchStart',[{x:x0,y:y0,id:1}]); for(let i=1;i<=15;i++){ await T('touchMove',[{x:x0+dx*i/15,y:y0+dy*i/15,id:1}]); await p.waitForTimeout(16);} await T('touchEnd',[]); await p.waitForTimeout(150); };
const out=[];
for(const mode of ['royale','1v1']) for(const z of [1,1.5]){
  await p.evaluate(([mode,z])=>{ G.bwCfg= mode==='royale'? {royale:36,seed:88,map:4} : {map:5}; startBigWar(mode==='royale'?5:4); const bw=__ltm.bw; bw.intro=null; bw.nextAI=1e9; bw.aiTurn=()=>{}; },[mode,z]);
  await p.waitForTimeout(200);
  // đặt một đạo quân ta ngay góc trên-trái bản đồ, camera đang ở góc
  const info=await p.evaluate((z)=>{ const bw=__ltm.bw; bw.armies.length=0;
    const a={owner:0,type:'spear',count:810,x:150,y:215,to:-1,trail:0,camped:true,food:90,done:false}; bw.armies.push(a); window.__A=a;
    bw.zoom=bw.zoomTgt=z; bw.camX=0; bw.camY=0; return true; },z);
  await p.waitForTimeout(200);
  const scr=()=>p.evaluate(()=>{ const bw=__ltm.bw, a=window.__A, r=document.getElementById('game').getBoundingClientRect(); return [(a.x-bw.camX)*bw.scale+r.left,(a.y-26-bw.camY)*bw.scale+r.top]; });
  const hud=await p.evaluate(()=>{ const r=document.getElementById('bwbar').getBoundingClientRect(); return [r.left,r.top,r.right,r.bottom]; });
  const s0=await scr(); const under=s0[0]<hud[2]+30&&s0[1]<hud[3]+30;
  await p.screenshot({path:`/tmp/edge_${tag}_${mode}_${z}_truoc.png`});
  // kéo ngón tay từ giữa màn hình xuống-phải
  await drag(W*0.4,H*0.35,W*0.45,H*0.5);
  const s1=await scr();
  await p.screenshot({path:`/tmp/edge_${tag}_${mode}_${z}_sau.png`});
  await p.touchscreen.tap(s1[0],s1[1]); await p.waitForTimeout(120);
  const sel=await p.evaluate(()=>__ltm.bw.selA===window.__A);
  out.push(`${mode} zoom${z}: quân ở (${s0.map(v=>v|0)}) ${under?'BỊ NÚT ĐÈ':'không bị đè'} → sau khi kéo (${s1.map(v=>v|0)}) · chọn được: ${sel}`);
}
console.log(dev); out.forEach(l=>console.log('  '+l)); console.log('  errors',errs.length?errs:'none'); await b.close();
