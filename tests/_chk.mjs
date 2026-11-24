import { chromium } from 'playwright';
const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:395,height:859},isMobile:true,hasTouch:true})).newPage(); p.on('pageerror',e=>console.log('ERR',e.stack||String(e))); p.on('console',m=>{ if(m.type()==='error') console.log('C',m.text()); });
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500); console.log(await p.evaluate(()=>({ltm:!!window.__ltm,ver:document.title}))); await b.close();
