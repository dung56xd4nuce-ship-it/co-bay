// v2.7: Quần Hùng — mời / hủy liên minh qua MENU lệnh trên trại nước khác
import { chromium, devices } from 'playwright';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices['Pixel 7 landscape'];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{
  G.bwCfg={royale:36, seed:77}; startBigWar(5); const bw=__ltm.bw; bw.nextAI=1e9;
  const mine=bw.nodes.find(n=>n.owner===0&&n.camp); const camp=bw.nodes.find(n=>n.camp&&n.owner>=3&&!bw.allied(0,n.owner));
  bw.sel=mine; bw.tap(camp.x,camp.y); const ops1=bw.menu? bw.menu.opts.map(o=>o.id):[];
  const before=bw.allied(0,camp.owner); bw.menuPick('ally'); const after=bw.allied(0,camp.owner);
  const note1=bw.notes.map(n=>n.text);
  // hủy
  bw.sel=mine; bw.tap(camp.x,camp.y); const ops2=bw.menu? bw.menu.opts.map(o=>o.id):[];
  if(after){ bw.menuPick('unally'); }
  const cleared=!bw.allied(0,camp.owner);
  // allies shouldn't be foes
  const foeOk=!bw.isFoe(0,camp.owner) || !after;
  return {ops1,before,after,ops2,cleared,foeOk,note1};
});
console.log(JSON.stringify(r)); console.log('errors', errs.length?errs:'none');
await b.close();
