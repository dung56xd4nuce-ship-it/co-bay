import fs from 'fs';
const src = ['01_config.js','02_map.js','03_sim.js','04_ai.js'].map(f=>fs.readFileSync('src/'+f,'utf8')).join('\n');
const mod = new Function(src+'\nreturn {World, levelConfig, T, RULES, UNIT};')();
const {World, levelConfig, T} = mod;
const t0=Date.now();
const w = new World(levelConfig(1), 0, {allAI: process.argv[2]==='ai'});
console.log('gen ms', Date.now()-t0, 'units', w.units.length, 'neutral', w.units.filter(u=>u.f===99).length, 'items', w.items.length);
const counts={}; for(const v of w.t) counts[v]=(counts[v]||0)+1; console.log('terrain', counts);
const secs = +process.argv[3]||300; const t1=Date.now();
for(let k=0;k<secs/0.05;k++){ w.step(); if(w.tick%1200===0){ console.log('t',w.time.toFixed(0), w.factions.map(f=>`${f.def.short}:${f.count} op${f.stats.opened} k${f.stats.kills} l${f.stats.lost} h${f.holdTotal.toFixed(0)} ${f.aiState.phase||''}`).join(' | '), 'drum', w.drum.holder); } if(w.over) break; }
console.log('sim ms', Date.now()-t1, 'for', w.time.toFixed(1),'s', 'result', JSON.stringify(w.result));
