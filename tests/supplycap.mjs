// v2.8: trần quân theo lương — chờ lâu không đánh thì quân KHÔNG tăng vô hạn
import { chromium, devices } from 'playwright';
const b=await chromium.launch();
for(const dn of ['Pixel 7 landscape','iPhone 14 Pro landscape']){
const {defaultBrowserType,...o}=devices[dn]; const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const r=await p.evaluate(()=>{
  G.bwCfg={map:2}; startBigWar(3); const bw=__ltm.bw; bw.intro=null; bw.nextAI=1e9; bw.aiTurn=()=>{};
  const F=0, out=[];
  // kiểu "cày quân": cứ 20s rút hết quân trại ra dã ngoại để trại hồi lại
  for(let t=1;t<=1200;t++){ bw.update(0.5);
    if(t%40===0){ for(const n of bw.nodes){ if(n.owner===F&&n.camp&&n.count>200){ const a=bw.send(n,{x:n.x+150,y:n.y+60,id:-1}); } } }
    if(t%200===0) out.push({s:t/2, quân:bw.myPower(F), trần:bw.supplyCap(F), địch:bw.myPower(1), trầnĐịch:bw.supplyCap(1)}); }
  return out; });
console.log(dn); for(const x of r) console.log(JSON.stringify(x));
await p.screenshot({path:`/tmp/cap_${dn.split(' ')[0]}.png`});
console.log('errors', errs.length?errs:'none'); await ctx.close(); }
await b.close();
