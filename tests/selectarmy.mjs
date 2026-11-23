// CHỌN ĐẠO QUÂN bằng CHẠM THẬT khi quân đứng sát/đè lên trại chăn nuôi, làng, điểm trung lập, điểm địch, cạnh quân khác
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape', SRC=process.argv[3]||'http://localhost:8766/index.html';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(SRC); await p.waitForTimeout(1000);
const res={ok:0,fail:[]};
for(const mode of ['royale','1v1']){
  await p.evaluate((mode)=>{ G.bwCfg= mode==='royale'? {royale:36,seed:88,map:4} : {map:5}; startBigWar(mode==='royale'?5:4); const bw=__ltm.bw; bw.intro=null; bw.nextAI=1e9; bw.aiTurn=()=>{}; __ltm.G.paused=true; },mode);
  const kinds=['farm-ta','lang-ta','trung-lap','dich','canh-quan-dich'];
  for(const kind of kinds) for(const off of [[0,0],[0,30],[40,10],[-60,20],[70,-20],[30,55]]) for(const cnt of [60,700,6000]){
    // dựng cảnh, đặt camera để cả hai trong màn hình
    const sc=await p.evaluate(([kind,off,cnt])=>{ const bw=__ltm.bw, F=0; bw.armies.length=0; bw.sel=bw.selA=null; bw.selG=null; bw.menu=null;
      let n;
      if(kind==='farm-ta'){ n=bw.nodes.find(x=>x.eco==='farm'); n.owner=F; n.count=300; }
      else if(kind==='lang-ta'){ n=bw.nodes.find(x=>x.struct==='village'&&!x.camp)||bw.nodes.find(x=>!x.camp&&!x.eco); n.owner=F; n.count=500; }
      else if(kind==='trung-lap'){ n=bw.nodes.find(x=>x.owner===2&&!x.eco); n.count=300; }
      else { n=bw.nodes.find(x=>x.owner!==F&&x.owner!==2&&!x.camp); n.count=900; }
      const a={owner:F,type:'spear',count:cnt,x:n.x+off[0],y:n.y+off[1],to:-1,trail:0,camped:true,food:90,done:false};
      bw.armies.push(a);
      if(kind==='canh-quan-dich') bw.armies.push({owner:1,type:'cavalry',count:900,x:a.x+70,y:a.y+15,to:-1,trail:0,camped:true,food:90,done:false});
      bw.zoom=bw.zoomTgt=1.3; const s=bw.scale0*1.3; bw.camX=a.x-(bw.lastVw||900)/s/2; bw.camY=Math.max(0,a.y-(bw.lastVh||400)/s/2);
      return true; },[kind,off,cnt]);
    await p.waitForTimeout(120);
    // chạm vào giữa hình quân (lính vẽ phía trên vị trí) — tọa độ màn hình thật
    const pt=await p.evaluate(()=>{ const bw=__ltm.bw, a=bw.armies[0], r=document.getElementById('game').getBoundingClientRect(); return [ (a.x-bw.camX)*bw.scale+r.left, (a.y-26-bw.camY)*bw.scale+r.top ]; });
    await p.touchscreen.tap(pt[0],pt[1]); await p.waitForTimeout(80);
    const got=await p.evaluate(()=>{ const bw=__ltm.bw; return bw.selA===bw.armies[0]?'army': bw.sel?('node:'+(bw.sel.eco||bw.sel.struct||'')): bw.menu?'menu':'none'; });
    if(got==='army') res.ok++; else res.fail.push(`${mode}/${kind} lệch(${off}) ${cnt}quân → ${got}`);
  }
}
console.log(dev,'| chọn được:',res.ok,'| không chọn được:',res.fail.length); for(const f of res.fail.slice(0,12)) console.log('  ',f);
console.log('  errors',errs.length?errs:'none'); await b.close();
