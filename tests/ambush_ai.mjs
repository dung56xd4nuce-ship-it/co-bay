// v2.7: bậc thầy (ải 10) đặt quân PHỤC KÍCH trên đường quân ta
import { chromium, devices } from 'playwright';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices['Pixel 7 landscape'];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{
  startBigWar(10); const bw=__ltm.bw; bw.nextAI=1e9; bw.nextWaveF={};
  const mine=bw.nodes.find(n=>n.owner===0&&n.camp); const foe=bw.nodes.find(n=>n.owner===1&&n.camp);
  const pa={owner:0,type:'spear',count:900,x:mine.x+1800,y:mine.y,to:-1,tx:mine.x+2700,ty:mine.y,camped:false,trail:0,food:100,done:false,ambush:false};
  const ai={owner:1,type:'spear',count:900,x:mine.x+2400,y:mine.y+150,to:-1,trail:0,food:100,done:false,camped:true,ambush:false};
  bw.armies.push(pa,ai); bw.nodes.forEach(n=>{ if(n.owner===1&&n.camp) { n.count=0; } });
  const seen={plan:false,amb:false}; const tierNow=BW_AI_TIER(bw.lv,false);
  bw.aiTurn(1); if(ai.aiAmbush) seen.plan=true;
  for(let i=0;i<60;i++){ bw.update(0.1); if(ai.aiAmbush) seen.plan=true; if(ai.ambush) { seen.amb=true; break; } }
  return {tier:tierNow, plannedAmbush:seen.plan, ambushSet:seen.amb, aiX:Math.round(ai.x), aiY:Math.round(ai.y)};
});
console.log(JSON.stringify(r)); console.log('errors', errs.length?errs:'none');
await b.close();
