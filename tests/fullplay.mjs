import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort()); await p.route('**/art/**', r=>r.abort());
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(300); await p.tap('#bPlay'); await p.waitForTimeout(400);
const tapWorld=async(x,y)=>{ await p.evaluate(([x,y])=>{ __ltm.G.ren.centerOn(x,y,true); },[x,y]); await p.waitForTimeout(60); const s=await p.evaluate(([x,y])=>__ltm.toScreen(x,y),[x,y]); await p.touchscreen.tap(s[0],s[1]+6); };
let shots=0;
for(let it=0; it<200; it++){
  const st=await p.evaluate(()=>{ const w=__ltm.world, f=w.factions[0], g=f.general; let b=null,bd=1e9; for(const [i] of f.memNeutral){ const x=i%w.W,y=(i/w.W)|0; const d=Math.abs(x-g.x)+Math.abs(y-g.y); if(d<bd){bd=d;b=[x,y];} } return {t:w.time,over:w.over,count:f.count,g:[g.x,g.y],dead:g.dead,near:b,bd,drum:[w.drum.x,w.drum.y],mode:g.mode}; });
  if(st.over) break;
  if(!st.dead){
    await p.tap('[data-act=general]');
    if(st.t<330 && st.near && st.bd<45 && st.count<30) await tapWorld(st.near[0],st.near[1]);
    else { await p.tap('[data-act=army]'); await tapWorld(st.drum[0],st.drum[1]+1); await p.tap('[data-act=general]'); await tapWorld(st.drum[0],st.drum[1]+1); }
  }
  await p.evaluate(()=>__ltm.stepSec(6));
  if(it%25===10 && shots<3){ shots++; await p.evaluate(()=>{ const g=__ltm.world.factions[0].general; __ltm.G.ren.centerOn(g.x,g.y,true); }); await p.waitForTimeout(500); await p.screenshot({path:`test/${which}-play${shots}.png`}); }
}
await p.waitForTimeout(2500);
const res=await p.evaluate(()=>({result:__ltm.world.result, me:__ltm.world.factions[0].stats, hold:__ltm.world.factions.map(f=>Math.round(f.holdTotal))}));
await p.screenshot({path:`test/${which}-result.png`});
console.log(JSON.stringify(res), errs); await b.close();
