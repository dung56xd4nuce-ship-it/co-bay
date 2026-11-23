// VÙNG QUÉT bằng CHẠM THẬT: giữ yên ~0.5s rồi kéo → chọn các đạo trong khung → chạm đích → cả cụm hành quân.
// Đồng thời: kéo nhanh vẫn là cuộn bản đồ, chạm nhanh vẫn là chạm.
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape', tag=dev.split(' ')[0];
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); const cdp=await ctx.newCDPSession(p);
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const {width:W,height:H}=p.viewportSize(); const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
const out=[];
for(const mode of ['royale','1v1']){
  await p.evaluate((mode)=>{ G.bwCfg= mode==='royale'? {royale:36,seed:91,map:2} : {map:3}; startBigWar(mode==='royale'?5:3); __ltm.bw.intro=null; },mode); await p.waitForTimeout(500);
  // 5 đạo quân ta: 3 trong vùng sẽ quét, 2 ngoài vùng; 1 đạo địch trong vùng
  const S=await p.evaluate(()=>{ const bw=__ltm.bw; bw.aiTurn=()=>{}; bw.nextAI=1e9; bw.armies.length=0; bw.notes=[];
    const cap=bw.nodes.find(n=>n.camp&&n.owner===0); const cx=cap.x+900, cy=cap.y;
    const mk=(dx,dy,o,c)=>{ const a={owner:o,type:'spear',count:c,x:cx+dx,y:cy+dy,to:-1,trail:0,camped:true,food:90,done:false}; bw.armies.push(a); return a; };
    window.__IN=[mk(-120,-40,0,500),mk(0,30,0,800),mk(110,-10,0,300)]; window.__OUT=[mk(-420,10,0,600),mk(380,60,0,700)]; window.__EN=mk(60,70,1,900);
    bw.zoom=bw.zoomTgt=1.1; const s=bw.scale0*1.1; bw.camX=cx-bw.lastVw/s/2; bw.camY=cy-bw.lastVh/s/2; bw._updateVision(); return {cx,cy}; });
  await p.waitForTimeout(250);
  const sp=(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; return [(wx-bw.camX)*bw.scale,(wy-bw.camY)*bw.scale]; },[wx,wy]);
  const a=await sp(S.cx-200,S.cy-140), c=await sp(S.cx+200,S.cy+130);
  // giữ yên 500ms rồi kéo chéo
  await T('touchStart',[{x:a[0],y:a[1],id:1}]); await p.waitForTimeout(500);
  for(let i=1;i<=12;i++){ await T('touchMove',[{x:a[0]+(c[0]-a[0])*i/12,y:a[1]+(c[1]-a[1])*i/12,id:1}]); await p.waitForTimeout(20); }
  await p.waitForTimeout(150); const live=await p.evaluate(()=>!!__ltm.bw.box); await p.screenshot({path:`/tmp/box_${tag}_${mode}_dang_quet.png`});
  await T('touchEnd',[]); await p.waitForTimeout(200);
  const sel=await p.evaluate(()=>{ const bw=__ltm.bw, G2=bw.selG||[]; return {so:G2.length, dungCacDaoTrong:window.__IN.every(a=>G2.includes(a)), khongLayDaoNgoai:!window.__OUT.some(a=>G2.includes(a)), khongLayDich:!G2.includes(window.__EN), camKhongTroi:true}; });
  await p.screenshot({path:`/tmp/box_${tag}_${mode}_da_chon.png`});
  // chạm vào điểm trống → menu → Hành quân
  const d=await sp(S.cx-100,S.cy+330); await p.touchscreen.tap(d[0],d[1]); await p.waitForTimeout(250);
  const opts=await p.evaluate(()=>__ltm.bw.menu? __ltm.bw.menu.opts.map(o=>o.id):[]);
  await p.evaluate(()=>{ if(__ltm.bw.menu) __ltm.bw.menuPick('move'); });
  const moving=await p.evaluate(()=>window.__IN.filter(a=>!a.camped||a.tx!=null).length+'/3 đạo hành quân, ngoài vùng đứng yên: '+window.__OUT.every(a=>a.camped&&a.tx==null));
  // kéo nhanh (không giữ) = cuộn
  const c0=await p.evaluate(()=>__ltm.bw.camX); await T('touchStart',[{x:W*0.5,y:H*0.5,id:1}]); for(let i=1;i<=8;i++){ await T('touchMove',[{x:W*0.5-i*20,y:H*0.5,id:1}]); await p.waitForTimeout(16);} await T('touchEnd',[]); await p.waitForTimeout(150);
  const c1=await p.evaluate(()=>[__ltm.bw.camX,!!__ltm.bw.box]);
  out.push(`${mode}: khung hiện khi kéo=${live} | ${JSON.stringify(sel)} | menu=${opts} | ${moving} | kéo nhanh cuộn ${(c1[0]-c0).toFixed(0)}px, không tạo khung=${!c1[1]}`);
}
console.log(dev); out.forEach(l=>console.log('  '+l)); console.log('  errors',errs.length?errs:'none'); await b.close();
