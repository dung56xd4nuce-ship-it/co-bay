import fs from 'fs';
const src = ['01_config.js','02_map.js','03_sim.js','04_ai.js'].map(f=>fs.readFileSync('src/'+f,'utf8')).join('\n');
const {World, levelConfig, T} = new Function(src+'\nreturn {World, levelConfig, T};')();
const w = new World(levelConfig(1), 0, {allAI:true});
for(let k=0;k<+process.argv[2]/0.05;k++) w.step();
for(const f of w.factions){ const g=f.general; console.log(f.def.short,'g',g.x,g.y,g.mode,g.moving,'stam',g.stam.toFixed(1),'order',g.order&&[g.order.x,g.order.y,g.order.count,!!g.order.field], 'stuck',g.stuck.toFixed(1),'dig',g.digTile, 'camp',f.camp.x,f.camp.y);
 const W=w.W; let s=''; for(let y=g.y-5;y<=g.y+5;y++){ for(let x=g.x-12;x<=g.x+12;x++){ const i=y*W+x; s+= (x===g.x&&y===g.y)?'@': !f.explored[i]?'#': '.,frhmWRbXPts'[w.t[i]]; } s+='\n'; } console.log(s); }
console.log([...w.digJobs.values()].map(j=>[j.f,j.i%w.W,(j.i/w.W)|0,j.prog.toFixed(2),j.rate]));
