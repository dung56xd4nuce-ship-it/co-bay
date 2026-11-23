import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort()); await p.route('**/art/**', r=>r.abort());
await p.goto('file://'+process.cwd()+'/dist/index.html'); await p.waitForTimeout(500);
await p.tap('#bArt'); await p.waitForTimeout(200);
const dir=process.cwd()+'/test/fakeart/';
await p.setInputFiles('#artInput',['U04_archer.png','T01.png','P01_tree.png','G12 coin.png','random_name.png'].map(f=>dir+f));
await p.waitForFunction(()=>document.getElementById('artMsg').textContent.includes('Nạp'),null,{timeout:15000});
console.log(await p.textContent('#artMsg'), '|', await p.textContent('#artCount'));
await p.screenshot({path:`test/${which}-artscr.png`});
// reload: art persists via IndexedDB
await p.reload(); await p.waitForTimeout(1200);
console.log('after reload has archer art:', await p.evaluate(()=>!!ArtImages['unit:archer'] && ArtImages['unit:archer']._user));
// give coins, open forge, buy
await p.evaluate(()=>{ save.xu=500; Save.set(save); refreshXu(); });
await p.tap('#bForge'); await p.waitForTimeout(200);
const btns=await p.$$('#forgeList .btn'); await btns[5].tap(); await p.waitForTimeout(100); await (await p.$$('#forgeList .btn'))[1].tap(); await p.waitForTimeout(150);
console.log('up', await p.evaluate(()=>JSON.stringify(save.up)+' xu='+save.xu));
await p.screenshot({path:`test/${which}-forge.png`});
await p.tap('#forge [data-back]'); await p.tap('#bPlay'); await p.waitForTimeout(600);
const gw=await p.evaluate(()=>{ const g=__ltm.world.factions[0].general; return g.weapon.name+' dmgMul='+g.dmgMul; }); console.log('in game general:', gw);
// spawn an archer near general to see recolored art
await p.evaluate(()=>{ const w=__ltm.world, g=w.factions[0].general; for(let k=0;k<3;k++){ const x=g.x+2+k, y=g.y+1; if(!w.occ[y*w.W+x]) w.spawn(k,'archer',x,y); } __ltm.stepSec(0.1); });
await p.waitForTimeout(500); await p.screenshot({path:`test/${which}-artgame.png`});
console.log('errors',errs); await b.close();
