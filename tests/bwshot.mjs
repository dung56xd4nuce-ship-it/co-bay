import { chromium, devices } from 'playwright';
const dev = devices['Pixel 7 landscape'];
const br = await chromium.launch();
const pg = await (await br.newContext({...dev})).newPage();
await pg.goto('http://localhost:8766/index.html'); await pg.waitForTimeout(1200);
await pg.evaluate(()=>window.__ltm.startBigWar(4));
await pg.waitForTimeout(400);
// chơi vài nước rồi chụp
await pg.evaluate(()=>{ const G=window.__ltm.G,bw=G.bw; for(let i=0;i<900;i++) bw.update(1/60); });
await pg.waitForTimeout(300);
await pg.screenshot({path:'/tmp/bw_android.png'});
await br.close();
