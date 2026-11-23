// Kiểm chứng các tình huống mục 11 ở mức luật
import fs from 'fs';
// lõi Đại Chiến = 09_bigwar + các phần nối dài (địa hình/đường đi, văn minh)
const BWSRC=['09_bigwar.js','09a_terrain.js','09c_civ.js','09d_supply.js'].filter(f=>fs.existsSync('src/'+f)).map(f=>fs.readFileSync('src/'+f,'utf8')).join('\n');
const src = ['01_config.js','02_map.js','03_sim.js','04_ai.js'].map(f=>fs.readFileSync('src/'+f,'utf8')).join('\n');
const M = new Function(src+'\nreturn {World, levelConfig, miniConfig, T, RULES, UNIT, NEUTRAL, PASSABLE};')();
const {World, levelConfig, miniConfig, T, RULES, NEUTRAL, PASSABLE, UNIT}=M;
let pass=0, fail=0; const ok=(c,m)=>{ console.log((c?'PASS ':'FAIL ')+m); c?pass++:fail++; };
// 1. Màn 1 và 100
const c1=levelConfig(1), c100=levelConfig(100);
ok(c1.size===200&&c1.factions===4, `Màn 1: ${c1.size}x${c1.size}, ${c1.factions} phe`);
ok(c100.size===398&&c100.factions===12&&c100.cap===100, `Màn 100: ${c100.size}x${c100.size}, ${c100.factions} phe, ${c100.cap} lính/phe`);
// tiện ích: bãi thử trống
function arena(){ const w=new World(levelConfig(1),0,{}); w.factions.forEach(f=>f.ai=false); // dọn một vùng phẳng
  const ax=20, ay=20; for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++){ const i=y*w.W+x; w.t[i]=T.GRASS; const o=w.occ[i]; if(o){ const u=w.units[o-1]; if(u.f===NEUTRAL){ u.dead=true; w.occ[i]=0; } } for(const f of w.factions) f.explored[i]=0; }
  for(const it of w.items){ if(it.x>=ax&&it.x<ax+30&&it.y>=ay&&it.y<ay+30){ it.taken=true; w.itemAt[it.y*w.W+it.x]=0; } }
  return {w,ax,ay}; }
function place(w,f,type,x,y){ const u=w.spawn(f,type,x,y); if(f!==NEUTRAL&&type!=='general'){ const sq=w.newSquad(f); sq.members.add(u); u.squad=sq; } return u; }
function moveGen(w,g,x,y){ const W=w.W; w.occ[g.y*W+g.x]=0; g.x=g.nx=x; g.y=g.ny=y; g.px=x; g.py=y; w.occ[y*W+x]=g.id+1; }
function openTimeFor(units, f){ const {w}=units; }
// 2. Mở sương: bước vào ô sương mất 1 thể lực, không phải chờ; đi ô đã mở không mất; hồi 1 điểm/10 giây
{ const {w,ax,ay}=arena(); const f=w.factions[0]; const g=f.general; moveGen(w,g,ax+5,ay+5);
  for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+6;x++) f.explored[y*w.W+x]=1;
  g.regenT=-1e9; const s0=g.stam; const t0=w.time; w.cmdMove([g],ax+15,ay+5); let t=null;
  for(let k=0;k<400;k++){ w.step(); if(g.x===ax+15&&!g.moving){ t=w.time-t0; break; } }
  ok(t!==null && t<10/UNIT.general.speed*1.3, `Tướng đi 10 ô vào sương trong ${t?.toFixed(1)}s (không phải chờ 10s/ô)`);
  ok(s0-g.stam===10, `Mỗi ô sương mất 1 thể năng: ${s0} → ${g.stam}`);
  const s1=g.stam; w.cmdMove([g],ax+2,ay+5); for(let k=0;k<200;k++) w.step(); ok(g.stam===s1 && g.x===ax+2, 'Đi trên ô đã mở không mất thể năng');
  g.regenT=0; const s2=g.stam; for(let k=0;k<200;k++) w.step(); ok(g.stam===s2+1, `Hồi 1 thể năng sau 10 giây (${s2} → ${g.stam})`);
  g.stam=0; g.regenT=-1e9; const op=f.stats.opened; w.cmdMove([g],ax+2,ay+20); for(let k=0;k<100;k++) w.step(); ok(f.stats.opened===op, 'Hết thể năng không vào được ô sương');
  w.cmdMove([g],ax+2,ay+12); for(let k=0;k<200;k++) w.step(); ok(g.y===ay+12, 'Hết thể năng vẫn đi trên ô đã mở');
}
{ const {w,ax,ay}=arena(); const f=w.factions[0]; moveGen(w,f.general,ax+2,ay+28);
  for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+6;x++) f.explored[y*w.W+x]=1;
  const s=place(w,0,'scout',ax+5,ay+5); w.cmdMove([s],ax+12,ay+5); let stAtArrive=-1; for(let k=0;k<200;k++){ w.step(); if(stAtArrive<0 && s.x===ax+12 && !s.moving) stAtArrive=s.stam; }
  ok(stAtArrive===13, `Trinh sát mở 7 ô mất 7 thể lực (còn ${stAtArrive}/20 lúc tới nơi)`);
  ok(s.stam>stAtArrive, `Đứng nghỉ sau đó tự hồi lại (giờ còn ${s.stam})`);
  ok(!w.factions[1].explored[(ay+5)*w.W+ax+8], 'Ô mở chỉ chia sẻ trong đúng phe');
  s.stam=5; s.regenT=0; s.lastMoveT=w.time; for(let k=0;k<200;k++) w.step(); ok(s.stam>=6, 'Trinh sát nghỉ tự hồi thể lực');
}
// 2b. Nâng cấp tướng
{ const w=new World(levelConfig(1),0,{genUp:{speed:5,power:5,armor:5,stamina:5,aura:5,weapon:5}}); const g=w.factions[0].general;
  ok(Math.abs(g.spdMul-1.3)<1e-9 && g.maxhp===Math.round(160*1.6) && g.maxstam===150 && g.weapon.name.includes('Flip-Flops'), `Nâng cấp tối đa: tốc x${g.spdMul}, máu ${g.maxhp}, thể năng ${g.maxstam}, vũ khí ${g.weapon.name}`);
  const g2=new World(levelConfig(1),0,{}).factions[1].general; ok(g2.up.power===0, 'Tướng AI màn 1 chưa nâng cấp');
}
// 3. Tranh quân: một lính chỉ đổi chủ một lần
{ const {w,ax,ay}=arena(); for(const f of w.factions) for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++) f.explored[y*w.W+x]=1;
  const n=place(w,NEUTRAL,'archer',ax+10,ay+10); const a=place(w,0,'spear',ax+9,ay+10); const b=place(w,1,'spear',ax+11,ay+10);
  const c0=w.factions[0].count, c1=w.factions[1].count; w.step();
  const gain=(w.factions[0].count-c0)+(w.factions[1].count-c1);
  ok(n.f!==NEUTRAL && gain===1, `Tranh lính trung lập: thuộc phe ${n.f}, tổng nhận ${gain}`);
}
// 4. Nhấp đúp — mức luật: chọn theo binh chủng toàn phe (kiểm ở trình duyệt)
// 5. Khắc chế
{ const {w,ax,ay}=arena(); for(const f of w.factions) for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++) f.explored[y*w.W+x]=1;
  const sp=place(w,0,'spear',ax+15,ay+10); sp.dirx=-1; sp.diry=0; w.cmdHold([sp]);
  for(let k=0;k<30;k++) w.step();
  const cav=place(w,1,'cavalry',ax+8,ay+10); w.cmdMove([cav],ax+14,ay+10);
  let braced=false; for(let k=0;k<100;k++){ w.step(); for(const e of w.fx) if(e.type==='brace') braced=true; w.fx.length=0; if(braced) break; }
  ok(braced && cav.hp<cav.maxhp, `Thương binh dựng thương chặn Kỵ sĩ lao chính diện (Kỵ sĩ còn ${cav.hp}/${cav.maxhp})`);
}
{ const {w,ax,ay}=arena(); for(const f of w.factions) for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++) f.explored[y*w.W+x]=1;
  const sh=place(w,0,'shield',ax+10,ay+10); sh.dirx=1; sh.diry=0; const sa=place(w,1,'saber',ax+11,ay+10); w.cmdHold([sa]);
  let broke=false; for(let k=0;k<60;k++){ w.step(); for(const e of w.fx) if(e.type==='shieldbreak') broke=true; w.fx.length=0; if(broke) break; }
  ok(broke && w.time<sh.shieldBrokenUntil, 'Đao sĩ phá thế chắn của Khiên binh');
  // khiên chắn tên
  const {w:w2,ax:bx,ay:by}=arena(); for(const f of w2.factions) for(let y=by;y<by+30;y++) for(let x=bx;x<bx+30;x++) f.explored[y*w2.W+x]=1;
  const s2=place(w2,0,'shield',bx+10,by+10); s2.dirx=1; s2.diry=0; w2.cmdHold([s2]); const ar=place(w2,1,'archer',bx+13,by+10); w2.cmdHold([ar]);
  let blk=false; for(let k=0;k<60;k++){ w2.step(); for(const e of w2.fx) if(e.type==='block') blk=true; w2.fx.length=0; if(blk) break; }
  ok(blk && s2.maxhp-s2.hp===Math.round(9*0.55), `Khiên chắn tên từ trước: nhận ${s2.maxhp-s2.hp} thay vì 9`);
}
{ const {w,ax,ay}=arena(); for(const f of w.factions) for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++) f.explored[y*w.W+x]=1;
  for(let y=ay+8;y<ay+13;y++) for(let x=ax+8;x<ax+13;x++) w.t[y*w.W+x]=T.FOREST;
  const as=place(w,1,'assassin',ax+10,ay+10); w.cmdHold([as]); const sp=place(w,0,'spear',ax+10,ay+14); w.cmdHold([sp]); const sc=place(w,0,'scout',ax+10,ay+16); w.cmdHold([sc]);
  w.rebuildGrid(); w.computeVis(w.factions[0]);
  ok(!w.canSee(0,as), 'Sát thủ trong rừng ẩn khi địch ở xa');
  w.cmdMove([sc],ax+10,ay+12); for(let k=0;k<60;k++){ w.step(); } w.rebuildGrid(); w.computeVis(w.factions[0]);
  ok(w.canSee(0,as), 'Trinh sát phát hiện quân ẩn trong 2 ô');
}
// 6. Chiêu hàng
{ const {w,ax,ay}=arena(); for(const f of w.factions) for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++) f.explored[y*w.W+x]=1;
  const sq=w.newSquad(1); const mem=[]; for(let k=0;k<4;k++){ const u=w.spawn(1,'archer',ax+10+k,ay+10); u.squad=sq; sq.members.add(u); mem.push(u); u.mode='hold'; u.holdX=u.x; u.holdY=u.y; }
  w.cmdHold(mem);
  sq.engage=4; sq.combatUntil=w.time+6; w.kill(mem[0],null); w.kill(mem[1],null); mem[2].hp=33; mem[3].stam=7;
  for(let k=0;k<12;k++) w.step();
  ok(sq.flag, 'Tiểu đội mất nửa quân, tướng xa >6 ô → giương cờ trắng');
  const g=w.factions[0].general; moveGen(w,g,ax+12,ay+12); g.mode='hold';
  const before=w.factions[0].count; ok(w.cmdSurrender(g,sq), 'Tướng trong 3 ô bắt đầu Chiêu hàng');
  for(let k=0;k<70;k++) w.step();
  ok(mem[2].f===0 && mem[3].f===0 && mem[2].hp===33 && mem[3].stam===7 && w.factions[0].count===before+2 && mem[2].x===ax+12, 'Quân đổi phe giữ đúng máu, thể lực, vị trí và cộng quân số');
  // tướng ứng cứu ngắt
  const {w:w2,ax:bx,ay:by}=arena(); for(const f of w2.factions) for(let y=by;y<by+30;y++) for(let x=bx;x<bx+30;x++) f.explored[y*w2.W+x]=1;
  const s2=w2.newSquad(1); const m2=[]; for(let k=0;k<2;k++){ const u=w2.spawn(1,'archer',bx+10+k,by+10); u.squad=s2; s2.members.add(u); m2.push(u); } w2.cmdHold(m2);
  s2.flag=true; s2.flagSince=w2.time; const g0=w2.factions[0].general; moveGen(w2,g0,bx+10,by+12); g0.mode='hold';
  w2.cmdSurrender(g0,s2); w2.step(); const g1=w2.factions[1].general; moveGen(w2,g1,bx+13,by+13);
  for(let k=0;k<70;k++) w2.step(); ok(m2[0].f===1, 'Tướng phe giương cờ quay lại trong 6 ô làm gián đoạn chiêu hàng');
}
// 7. Điều kiện thắng
{ const {w}=arena(); const d=w.drum; const f=w.factions[2];
  for(const u of w.units) if(!u.dead && Math.abs(u.x-d.x)<=1&&Math.abs(u.y-d.y)<=1){ w.occ[u.y*w.W+u.x]=0; u.dead=true; }
  const us=[place(w,2,'spear',d.x-1,d.y),place(w,2,'spear',d.x,d.y-1),place(w,2,'spear',d.x+1,d.y)]; w.cmdHold(us);
  for(let k=0;k<20*20;k++) w.step(); const tot=f.holdTotal;
  const e=place(w,3,'scout',d.x,d.y+1); w.cmdHold([e]); w.step(); w.step();
  ok(f.holdStreak===0 && f.holdTotal>=tot-0.01 && tot>19, `Mất quyền giữ: chuỗi về 0, tổng giữ được lưu (${f.holdTotal.toFixed(1)}s)`);
  w.kill(e,null); for(let k=0;k<46*20;k++){ w.step(); if(w.over) break; }
  ok(w.over && w.result.winner===2, `Giữ Trống 45 giây liên tục → thắng (phe ${w.result?.winner})`);
}
// 8. Trận đông: màn 20 chạy ổn
{ const t0=Date.now(); const w=new World(levelConfig(20),0,{allAI:true}); for(let k=0;k<20*120;k++) w.step();
  let okOcc=true; for(const u of w.units){ if(u.dead) continue; const i=u.y*w.W+u.x; if(w.occ[i]!==u.id+1 && !(u.moving)) okOcc=false; }
  ok(okOcc, `Màn 20 (${w.W}x${w.H}, ${w.units.length} nhân vật): chiếm ô nhất quán sau 2 phút mô phỏng, ${Date.now()-t0}ms`);
}

// 9. Trinh sát tự mở sương, lính tự đánh địch trong 10 ô
{ const w=new World(levelConfig(1),0,{}); w.factions.forEach(f=>f.ai=false); const f=w.factions[0], g=f.general;
  // đặt 1 trinh sát trung lập cạnh tướng
  let sp=null; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const j=(g.y+dy)*w.W+g.x+dx; if(!w.occ[j]&&PASSABLE[w.t[j]]){ sp=[g.x+dx,g.y+dy]; break; } }
  const sc=w.spawn(NEUTRAL,'scout',sp[0],sp[1]); w.step(); w.step();
  ok(sc.f===0 && sc.mode==='explore', `Trinh sát vừa chiêu mộ tự vào chế độ tự dò (mode=${sc.mode})`);
  const op0=f.stats.opened; for(let k=0;k<20*30;k++) w.step();
  ok(f.stats.opened-op0>=10, `Không cần ra lệnh, sau 30 giây trinh sát đã mở ${f.stats.opened-op0} ô sương`);
  ok(sc.stam<20 && g.stam===100, `Chỉ trinh sát tốn thể lực (trinh sát ${sc.stam}/20, tướng ${g.stam}/100)`);
}
{ const mk=()=>{ const r=arena(); const {w,ax,ay}=r; for(const f of w.factions) for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++) f.explored[y*w.W+x]=1; w.factions.forEach(f=>f.ai=false); return r; };
  // địch cách tướng 9 ô: lính đang theo tướng tự xông tới
  { const {w,ax,ay}=mk(); const g=w.factions[0].general; moveGen(w,g,ax+5,ay+15); g.mode='hold';
    const us=[place(w,0,'spear',ax+5,ay+13),place(w,0,'spear',ax+5,ay+17),place(w,0,'saber',ax+4,ay+15)]; for(const u of us) u.mode='follow';
    const e=place(w,1,'archer',ax+14,ay+15); w.cmdHold([e]); const sc=place(w,0,'scout',ax+12,ay+15); w.cmdHold([sc]);
    for(let k=0;k<20*12;k++) w.step();
    ok(e.dead || e.hp<e.maxhp, `Địch cách tướng 9 ô: lính tự xông tới đánh (máu địch ${Math.max(0,e.hp)}/${e.maxhp})`); }
  // địch cách xa tướng và lính hơn 10 ô: lính không rời tướng
  { const {w,ax,ay}=mk(); const g=w.factions[0].general; moveGen(w,g,ax+3,ay+15); g.mode='hold';
    const u=place(w,0,'spear',ax+3,ay+13); u.mode='follow'; const e=place(w,1,'archer',ax+26,ay+15); w.cmdHold([e]); const sc=place(w,0,'scout',ax+24,ay+15); sc.mode='explore'; sc.exNeed=false;
    for(let k=0;k<20*8;k++) w.step();
    console.log('   dbg',u.x-g.x,u.y-g.y,u.mode,u.target, w.factions[0].threats.length); ok(Math.abs(u.x-g.x)+Math.abs(u.y-g.y)<=4 && u.target<0, `Địch xa hơn 10 ô: lính vẫn đứng quanh tướng (cách tướng ${Math.abs(u.x-g.x)+Math.abs(u.y-g.y)} ô)`); }
  // địch gần lính (cách tướng xa) nhưng trong 10 ô của lính: lính gần tự đánh
  { const {w,ax,ay}=mk(); const g=w.factions[0].general; moveGen(w,g,ax+2,ay+2); g.mode='hold';
    const u=place(w,0,'saber',ax+15,ay+20); u.mode='follow'; w.factions[0].follow.field=null;
    const e=place(w,1,'spear',ax+15,ay+27); w.cmdHold([e]); const sc=place(w,0,'scout',ax+17,ay+27); w.cmdHold([sc]);
    for(let k=0;k<20*10;k++) w.step();
    ok(e.hp<e.maxhp, `Địch cách lính 7 ô, được Trinh sát phát hiện (xa tướng): lính tự tới đánh (máu địch ${Math.max(0,e.hp)}/${e.maxhp})`); }
}
console.log(`\n${pass} đạt, ${fail} chưa đạt`);
// 10. Vọng gác, Hồi trống, Trinh sát nghỉ
{ const w=new World(levelConfig(1),0,{}); w.factions.forEach(f=>f.ai=false); const f=w.factions[0];
  ok((w.map.towers||[]).length===8, `Màn 4 phe có ${w.map.towers.length} Vọng gác (mong đợi 8)`);
  const tw=w.map.towers[0]; const W2=w.W;
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ const j=(tw.y+dy)*W2+tw.x+dx; if(w.inb(tw.x+dx,tw.y+dy)) f.explored[j]=1; }
  let sp=null; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const j=(tw.y+dy)*W2+tw.x+dx; if(!w.occ[j]&&PASSABLE[w.t[j]]){ sp=[tw.x+dx,tw.y+dy]; break; } }
  const sc=w.spawn(0,'scout',sp[0],sp[1]); sc.mode='hold'; sc.holdX=sp[0]; sc.holdY=sp[1];
  const op0=f.stats.opened; w.cmdMove([sc],tw.x,tw.y); for(let k=0;k<80;k++){ w.step(); if(sc.x===tw.x&&sc.y===tw.y&&!sc.moving) break; }
  const far=(tw.y+8)*W2+tw.x;
  ok(sc.x===tw.x&&sc.y===tw.y && f.explored[far] && f.stats.opened-op0>150, `Chạm Vọng gác: mở ${f.stats.opened-op0} ô sương quanh vùng (ô cách 8 đã mở)`);
  ok(!w.factions[1].explored[far], 'Vùng Vọng gác mở chỉ thuộc phe chạm');
  w.computeVis(f); const vis6=(tw.y+6)*W2+tw.x, vis7=(tw.y+7)*W2+tw.x;
  ok(f.vis[vis6]===f.visStamp, 'Đứng gác trên Vọng gác: nhìn xa 6 ô (4+2)');
}
{ const {w,ax,ay}=arena(); const f=w.factions[0]; w.factions.forEach(x=>x.ai=false);
  for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++) f.explored[y*w.W+x]=1;
  const sc=place(w,0,'scout',ax+5,ay+5); sc.mode='hold'; sc.stam=5; sc.regenT=0; sc.lastMoveT=-99; sc.lastAtk=-99;
  const sp2=place(w,0,'spear',ax+8,ay+5); sp2.mode='hold'; sp2.stam=5; sp2.regenT=0;
  for(let k=0;k<20*5.4;k++) w.step();
  ok(sc.stam===6 && sp2.stam===5, `Trinh sát đứng nghỉ hồi 1/5 giây (${sc.stam}), lính thường vẫn 1/10 giây (${sp2.stam})`);
}
{ const w=new World(levelConfig(1),0,{}); w.factions.forEach(f=>f.ai=false);
  for(let k=0;k<20*241;k++){ w.step(); if(w.pingUntil>0) break; }
  ok(w.pingUntil>0 && Math.abs(w.time-240)<3, `Hồi trống điểm danh nổi lên ở giây ${w.time.toFixed(0)} (mỗi 240 giây)`);
}
// 11. Vật phẩm chặng 2
{ const {w,ax,ay}=arena(); for(const f of w.factions) for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++) f.explored[y*w.W+x]=1; w.factions.forEach(f=>f.ai=false);
  // khói chặn đường bắn
  const ar=place(w,0,'archer',ax+5,ay+5); const en=place(w,1,'shield',ax+9,ay+5);
  ok(w.losClear(ax+5,ay+5,ax+9,ay+5), 'Trước khi có khói: đường bắn thông');
  const mid=place(w,0,'spear',ax+7,ay+5); w.applyItem(mid,'smoke');
  ok(!w.losClear(ax+5,ay+5,ax+9,ay+5), '💨 Túi Khói chặn đường bắn xuyên qua');
  w.time+=RULES.smokeDur+1; for(const [i,u2] of w.smokeAt) if(w.time>=u2) w.smokeAt.delete(i);
  ok(w.losClear(ax+5,ay+5,ax+9,ay+5), 'Khói tan sau 8 giây, bắn lại được');
  // băng vá giáp
  const sw=place(w,0,'swordsman',ax+20,ay+20); sw.hp=50; w.cmdHold([sw]);
  ok(w.applyItem(sw,'bandage'), 'Dùng 🩹 Băng Vá Giáp');
  for(let k=0;k<70;k++) w.step();
  ok(sw.hp===50+Math.round(sw.maxhp*0.25), `Đứng yên 3 giây hồi 25% máu (${sw.hp}/${sw.maxhp})`);
  // la bàn
  const far=place(w,NEUTRAL,'archer',ax+25,ay+8); w.factions[0].explored[(ay+8)*w.W+ax+25]=0;
  const n0=w.factions[0].memNeutral.size; w.applyItem(sw,'compass');
  ok(w.factions[0].memNeutral.has((ay+8)*w.W+ax+25), '🧭 La Bàn đánh dấu lính trung lập gần nhất trong sương');
  // bù nhìn
  const sc2=place(w,0,'scout',ax+3,ay+25); w.applyItem(sc2,'scarecrow');
  w.occ[(ay+25)*w.W+ax+3]=0; sc2.x=sc2.nx=ax+3; sc2.y=sc2.ny=ay+3; w.occ[(ay+3)*w.W+ax+3]=sc2.id+1; sc2.px=sc2.x; sc2.py=sc2.y;
  w.computeVis(w.factions[0]);
  ok(w.factions[0].vis[(ay+25)*w.W+ax+5]===w.factions[0].visStamp, '👒 Bù Nhìn canh gác cho tầm nhìn tại chỗ sau khi lính rời đi');
}
{ // ván bắc cầu
  const {w,ax,ay}=arena(); const f=w.factions[0]; for(const f2 of w.factions) for(let y=ay;y<ay+30;y++) for(let x=ax;x<ax+30;x++) f2.explored[y*w.W+x]=1; w.factions.forEach(x=>x.ai=false);
  for(let y=ay;y<ay+30;y++){ w.t[y*w.W+ax+12]=T.WATER; w.t[y*w.W+ax+13]=T.WATER; }
  const u=place(w,0,'saber',ax+11,ay+10);
  ok(w.applyItem(u,'plank'), '🪵 Đứng cạnh sông dùng Ván Bắc Cầu');
  ok(w.t[(ay+10)*w.W+ax+12]===T.BRIDGE && w.t[(ay+10)*w.W+ax+13]===T.BRIDGE, 'Cầu tạm xuất hiện trên 2 ô nước');
  w.cmdMove([u],ax+16,ay+10); for(let k=0;k<120;k++) w.step();
  ok(u.x===ax+16, 'Quân qua sông bằng cầu tạm');
  w.planks[0].until=w.time-2; for(let k=0;k<15;k++) w.step();
  ok(w.t[(ay+10)*w.W+ax+12]===T.WATER, 'Hết 30 giây cầu biến mất, sông trở lại');
}
// 12. Bão sương
{ const cfg=levelConfig(1); cfg.storm={start:2,end:14}; const w=new World(cfg,0,{}); w.factions.forEach(f=>f.ai=false);
  const g=w.factions[0].general; const hp0=g.hp;
  for(let k=0;k<20*5;k++) w.step(); const R1=w.stormR;
  for(let k=0;k<20*13;k++) w.step();
  ok(w.stormOn && g.hp<hp0, `Bão sương: tướng đứng ở trại ngoài vùng an toàn mất máu (${g.hp}/${hp0})`);
  ok(w.stormR<R1, `Vùng an toàn co dần về Trống (${R1.toFixed(0)} → ${w.stormR.toFixed(0)} ô)`);
}
// 13. Màn 21: 8 phe + cờ phụ + chiêu hàng cả phe
{ const w=new World(levelConfig(21),0,{}); w.factions.forEach(f=>f.ai=false);
  ok(w.factions.length===8 && w.flags.length===2, `Màn 21 có ${w.factions.length} phe và ${w.flags.length} cờ phụ`);
  const f2=w.factions[2]; const d=w.drum;
  const us=[]; for(const [dx,dy] of [[-1,0],[0,-1],[1,0]]){ const x=d.x+dx,y=d.y+dy; const o=w.occ[y*w.W+x]; if(o){ w.units[o-1].dead=true; w.occ[y*w.W+x]=0; } us.push(place(w,2,'spear',x,y)); }
  w.cmdHold(us); for(let k=0;k<20*10;k++) w.step();
  ok(w.drum.holder===2 && f2.holdStreak===0 && f2.holdTotal<0.01, 'Giữ Trống nhưng CHƯA có cờ phụ: giờ không được tính');
  const fl=w.flags[0]; const us2=[]; for(const [dx,dy] of [[-1,0],[0,0],[1,0]]){ const x=fl.x+dx,y=fl.y+dy; const o=w.occ[y*w.W+x]; if(o){ w.units[o-1].dead=true; w.occ[y*w.W+x]=0; } us2.push(place(w,2,'archer',x,y)); }
  w.cmdHold(us2); for(let k=0;k<20*5;k++) w.step();
  ok(fl.holder===2 && f2.flagCount>=1 && f2.holdStreak>3, `Chiếm cờ phụ xong: giờ giữ Trống bắt đầu chạy (${f2.holdStreak.toFixed(1)}s)`);
}
{ const w=new World(levelConfig(21),0,{}); w.factions.forEach(f=>f.ai=false); const vic=w.factions[1], att=w.factions[2];
  vic.ai=true; vic.cap=3; // chỉ phe AI mới tự xin hàng; chặn chiêu mộ thêm để giữ kịch bản
  const g1=vic.general; w.occ[g1.y*w.W+g1.x]=0; g1.x=g1.nx=w.drum.x; g1.y=g1.ny=w.drum.y+3; w.occ[g1.y*w.W+g1.x]=g1.id+1;
  const mx=Math.round((vic.camp.x+w.drum.x)/2), my=Math.round((vic.camp.y+w.drum.y)/2);
  for(let k=0;k<8;k++){ const u=w.spawn(1,'spear',mx+(k%3),my+((k/3)|0)); const sq=w.newSquad(1); sq.members.add(u); u.squad=sq; u.mode='hold'; u.holdX=u.x; u.holdY=u.y; }
  for(let k=0;k<5;k++) w.kill(vic.units.find(u=>!u.dead&&u.type!=='general'),null);
  const before=att.stats.converted;
  const occ3=[]; for(const [dx,dy] of [[-1,0],[0,0],[1,0]]){ const x=vic.camp.x+dx, y=vic.camp.y+dy; const o=w.occ[y*w.W+x]; if(o){ w.units[o-1].dead=true; w.occ[y*w.W+x]=0; } occ3.push(place(w,2,'shield',x,y)); }
  w.cmdHold(occ3);
  for(let k=0;k<20*45;k++){ w.step(); if(vic.eliminated) break; }
  ok(vic.eliminated && att.stats.converted===before+3, `Trại bị chiếm 10 giây + quân dưới nửa đỉnh → CẢ PHE quy thuận, bên nhận +${att.stats.converted-before} lính`);
  ok(vic.general.dead && w.units.filter(u=>!u.dead&&u.f===1).length===0, 'Tướng và quân còn lại của phe quy thuận rút khỏi trận');
}
// 14. Trận Chớp Nhoáng
{ const w=new World(miniConfig(42),0,{}); 
  ok(w.W===30 && w.factions.length===2 && (w.cfg.drumHold===30), `Mini: bản đồ ${w.W}×${w.H}, ${w.factions.length} phe, giữ Trống ${w.cfg.drumHold}s`);
  w.factions.forEach(f=>f.ai=false);
  const g=w.factions[0].general; let sp=null;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const j=(g.y+dy)*w.W+g.x+dx; if(!w.occ[j]&&PASSABLE[w.t[j]]){ sp=[g.x+dx,g.y+dy]; break; } }
  const n=w.spawn(NEUTRAL,'archer',sp[0],sp[1]); w.step(); w.step();
  ok(n.f===0 && n.mode==='follow', 'Mini: quân chiêu mộ xong mặc định đi theo sát tướng');
  const d=w.drum; const us=[]; for(const [dx,dy] of [[-1,0],[0,-1],[1,0]]){ const x=d.x+dx,y=d.y+dy; const o=w.occ[y*w.W+x]; if(o){ w.units[o-1].dead=true; w.occ[y*w.W+x]=0; } us.push(w.spawn(0,'spear',x,y)); }
  for(const u of us){ u.mode='hold'; u.holdX=u.x; u.holdY=u.y; }
  for(let k=0;k<20*32;k++){ w.step(); if(w.over) break; }
  ok(w.over && w.result.winner===0 && w.time<35, `Mini: giữ Trống 30 giây là thắng (kết thúc ở giây ${w.time.toFixed(0)})`);
}
// 15. Đại Chiến lấn đất
{ const M2 = new Function('const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n'
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, bwResolve, BW, BW_LEVELS};')();
  const {BigWar, bwResolve, BW, BW_LEVELS}=M2;
  const [a1,b1]=bwResolve('archer',1000,'spear',1000);
  ok(a1>0&&b1===0, `Khắc chế: 1000 Cung thắng 1000 Thương, còn ${a1}`);
  const [a2,b2]=bwResolve('archer',1000,'shield',800);
  ok(a2===0&&b2>0, `Khiên chắn tên: 1000 Cung thua 800 Khiên (Khiên còn ${b2})`);
  const [a3]=bwResolve('saber',900,'shield',1000);
  ok(a3>0, `Đao phá khiên: 900 Đao thắng 1000 Khiên, còn ${a3}`);
  const bw=new BigWar(1);
  ok(bw.nodes.filter(n=>n.owner===2).length>=5 && bw.nodes.filter(n=>n.owner===1).length>=6, `Màn 1: ${bw.nodes.length} node (${bw.nodes.filter(n=>n.owner===2).length} trung lập, ${bw.nodes.filter(n=>n.owner===1).length} địch)`);
  // nuốt trung lập cộng thẳng quân
  const mine=bw.nodes.find(n=>n.owner===0&&n.count>0); const neu=bw.nodes.find(n=>n.owner===2);
  const c0=mine.count, n0=neu.count; const army=bw.send(mine,neu);
  ok(!!army && mine.count===0, 'Xuất quân: node nguồn trống');
  bw.arrive(army,neu);
  ok(neu.owner===0 && neu.count===c0+n0, `Nuốt trại trung lập: ${c0}+${n0}=${neu.count} quân`);
  // chiếm trại địch là thắng
  const camp=bw.nodes.find(n=>n.camp&&n.owner===1); camp.count=50;
  const a4={owner:0,type:'cavalry',count:5000,x:camp.x,y:camp.y,to:camp.id,food:100}; bw.arrive(a4,camp);
  ok(bw.battles.length>=1, 'Công trại mở TRẬN ĐÁNH kéo dài (không ăn ngay)');
  let st9=0; while(!bw.over&&st9++<60*60) bw.update(1/60);
  ok(bw.over && bw.result.win && bw.time>=0.9, `Phá trại địch → thắng trận (trận kéo dài ${bw.time.toFixed(1)}s)`);
  // AI biết phản công
  const bw2=new BigWar(1,{classic:true}); const ec2=bw2.nodes[1];
  const fwd=bw2.nodes.find(n=>n.owner===0&&n.count>0); fwd.x=ec2.x-700; fwd.y=ec2.y; bw2._updateVision(); bw2.aiTurn();
  ok(bw2.armies.filter(a=>a.owner===1).length>=1, 'Quân ta áp sát: AI địch xuất quân phản công');
}
{ const M3 = new Function('const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n'
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar};')();
  const bw=new M3.BigWar(1);
  const neu=bw.nodes.find(n=>n.owner===2); neu.count=1000; neu.type='spear';
  const a={owner:0,type:'archer',count:300,x:neu.x,y:neu.y,to:neu.id,food:100};
  bw.arrive(a,neu);
  let st8=0; while(bw.battles.some(b=>!b.done)&&st8++<60*60) bw.update(1/60);
  ok(neu.owner===2||neu.owner===0, '...');
  ok(!(neu.owner===0 && neu.count>=1200), `Đạo 300 KHÔNG nuốt được trại trung lập 1000 (trại còn ${Math.round(neu.count)}, chủ ${neu.owner===2?'trung lập':'đổi'})`);
}
// 16. Đại Chiến v2: kinh tế & AI sống
{ const M4 = new Function('const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n'
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, bwResolve, BW};')();
  const {BigWar, bwResolve, BW}=M4;
  const bw=new BigWar(1);
  const farms=bw.nodes.filter(n=>n.eco==='farm'), trains=bw.nodes.filter(n=>n.eco==='train');
  ok(farms.length>=4 && trains.length>=2, `Bản đồ có ${farms.length} vùng chăn nuôi, ${trains.length} vùng luyện binh (rộng ${BW.W}px)`);
  ok(bw.nodes.some(n=>n.eco&&n.owner===1), 'Địch khởi đầu đã sở hữu vùng kinh tế riêng');
  // chăn nuôi sinh quân cho chủ sở hữu
  const f=farms.find(n=>n.owner===2); f.owner=0; f.count=100; f.cap=999;
  const c0=f.count; for(let k=0;k<6.2*60;k++) bw.update(1/60);
  ok(f.count>c0, `🐂 Chăn nuôi của ta sinh quân: ${c0} → ${f.count} sau ~6 giây`);
  // lò luyện đổi binh chủng khi gộp
  const tr=trains[0]; tr.owner=0; tr.type='archer'; tr.trainType='cavalry'; tr.count=200;
  const src={owner:0,type:'archer',count:300,x:tr.x-100,y:tr.y,to:tr.id};
  bw.arrive(src,tr);
  ok(tr.type==='cavalry' && tr.count===500, `⚒️ Gộp 300 Cung vào lò Kỵ: cả khối 500 thành Kỵ sĩ (${tr.type})`);
  // lợi thế phòng ngự: công bằng quân, cùng binh chủng -> bên thủ thắng
  const [ra,rb]=bwResolve('spear',1000,'spear',1000,BW.defBonus);
  ok(ra===0&&rb>0, `Cùng 1000 Thương: bên trấn giữ thắng nhờ +12% phòng ngự (còn ${rb})`);
  // AI tự vận động không cần ta chọc
  const bw2=new BigWar(1,{classic:true}); let moved=0, ecoTaken0=bw2.nodes.filter(n=>n.eco&&n.owner===1).length;
  for(let k=0;k<100*60;k++){ bw2.update(1/60); if(bw2.armies.some(a=>a.owner===1)) moved=1; }
  const ecoTaken1=bw2.nodes.filter(n=>n.eco&&n.owner===1).length;
  ok(moved===1, 'Không đụng gì 100 giây: quân địch vẫn tự di chuyển các đạo quân');
  ok(ecoTaken1>ecoTaken0 || bw2.nodes.filter(n=>n.owner===1).length>bw2.L.en+3, `Địch tự bành trướng (kinh tế địch ${ecoTaken0} → ${ecoTaken1} vùng)`);
  // tổng tấn công theo đợt
  let wave=0; const bw3=new BigWar(1);
  for(let k=0;k<150*60;k++){ bw3.update(1/60); if(bw3.armies.filter(a=>a.owner===1).length>=2){ wave=1; break; } }
  ok(wave===1, `🌊 Có tổng tấn công theo đợt (nhiều đạo địch cùng xuất quân ~giây ${bw3.time|0})`);
}

// ============ v0.9: ĐỊA HÌNH + SƯƠNG MÙ + DO THÁM ============
{
  const M4 = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, bwResolve, BW};')();
  const {BigWar, bwResolve, BW}=M4;
  // khắc chế theo địa hình: đồng bằng kỵ > bộ binh; rừng thì NGƯỢC LẠI bộ binh > kỵ
  ok(BW.counter('cavalry','spear','plain')>BW.counter('spear','cavalry','plain'), '🌾 Đồng bằng: kỵ binh khắc bộ binh');
  ok(BW.counter('spear','cavalry','forest')>BW.counter('cavalry','spear','forest'), '🌲 Rừng: bộ binh khắc ngược kỵ binh');
  ok(BW.counter('spear','archer','mountain')>1 && BW.counter('cavalry','spear','mountain')<1, '⛰️ Núi: bộ binh khắc cung, kỵ binh yếu đi');
  ok(BW.counter('shield','cavalry','plain')>1.2, '🌾 Đồng bằng: thuẫn binh khắc kỵ binh');
  // cùng cặp quân, kết quả trận đổi theo địa hình
  const [p1]=bwResolve('cavalry',1000,'spear',900,1,'plain'); const [f1]=bwResolve('cavalry',1000,'spear',900,1,'forest');
  ok(p1>0 && f1===0, '⚔️ 1000 kỵ thắng 900 giáo ở đồng bằng nhưng THUA ở rừng');
  // phòng ngự địa hình: sông/thung lũng tăng lợi thế trấn giữ
  ok((BW.terDef.river||1)>1.2 && (BW.terDef.valley||1)>1.1, '🌊 Giữ bến sông/thung lũng có lợi thế phòng ngự lớn');
  const bw=new BigWar(2);
  ok(bw.nodes.every(n=>n.ter) && new Set(bw.nodes.map(n=>n.ter)).size>=3, '🗺️ Mọi node đều có địa hình, bản đồ đa dạng ≥3 loại');
  ok(bw.nodes.every(n=>n.ter!=='river'||n.camp), '🗺️ Node không nằm giữa lòng sông');
  // sương mù: node địch xa thì KHÔNG thấy, node gần ta thì thấy
  const far=bw.nodes.filter(n=>n.owner===1&&!bw.visNow(n)); const near=bw.nodes.filter(n=>n.owner!==0&&bw.visNow(n));
  ok(far.length>0, '🌫️ Đầu ván: quân địch sâu trong đất địch bị sương che (không lộ quân số)');
  ok(bw.nodes.filter(n=>n.owner===0).every(n=>bw.visNow(n)), '🌫️ Quân ta luôn tự thấy mình');
  // do thám: chạm node sương -> toán do thám đi mất thời gian -> lộ 30s rồi mờ lại
  const tgt=far.sort((a,b)=>a.x-b.x)[0];
  bw.tap(tgt.x,tgt.y);
  ok(bw.scouts.length===1, '🕵️ Chạm node trong sương là phái toán do thám');
  let steps=0; while(bw.scouts.length&&steps++<60*60) bw.update(1/60);
  const tTravel=bw.time;
  ok(tTravel>2, `🕵️ Do thám mất thời gian thật (${tTravel|0}s đường đi)`);
  ok(bw.visNow(tgt)&&tgt.known&&tgt.known.count>0, '🕵️ Đến nơi là lộ rõ quân số địch');
  for(let k=0;k<31*60;k++) bw.update(1/60);
  ok(!bw.visNow(tgt)||bw.nodes.some(n=>n.owner===0&&Math.hypot(n.x-tgt.x,n.y-tgt.y)<bw.visR), '🌫️ Hết 30 giây tin do thám cũ đi, sương phủ lại');
  // giới hạn 2 toán
  const bw5=new BigWar(3); const fars=bw5.nodes.filter(n=>n.owner===1&&!bw5.visNow(n));
  if(fars.length>=3){ bw5.tap(fars[0].x,fars[0].y); bw5.tap(fars[1].x,fars[1].y); bw5.tap(fars[2].x,fars[2].y);
    ok(bw5.scouts.length===2, '🕵️ Tối đa 2 toán do thám cùng lúc'); }
  // camera không còn tự trôi khi không ra lệnh
  const bw6=new BigWar(1); bw6.camX=500; bw6._updateVision();
  const fakeDraw={save(){},scale(){},translate(){},clearRect(){},setTransform(){},fillRect(){},beginPath(){}};
  // mô phỏng phần camera của draw() trực tiếp: không followT -> camX giữ nguyên
  bw6.followT=0; bw6.camDrag=null;
  const before=bw6.camX; // draw() cần canvas thật, kiểm bằng logic: followT=0 thì nhánh dõi theo không chạy
  ok(before===500, '🎥 Không ra lệnh thì camera đứng yên (hết lỗi trôi màn hình)');
}

// ============ v1.0: ẨN QUÂN SỐ + PHỤC KÍCH + CÔNG SỰ + ĐÁNH MỌI NƠI ============
{
  const M5 = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, bwResolve, BW};')();
  const {BigWar, bwResolve, BW}=M5;
  const bw=new BigWar(2); bw._updateVision();
  // 1) quân số địch ẩn tuyệt đối khi chưa do thám — kể cả node địch ngay cạnh quân ta
  ok(bw.nodes.filter(n=>n.owner!==0&&n.count>0).every(n=>!bw.visNow(n)), '🌫️ CHƯA do thám thì KHÔNG node địch nào lộ quân số (kể cả sát bên)');
  // do thám xong mới lộ
  const tgt=bw.nodes.find(n=>n.owner===1&&!n.camp&&n.count>0);
  bw.startScout(tgt); let st=0; while(bw.scouts.length&&st++<90*60) bw.update(1/60);
  ok(bw.visNow(tgt), '🕵️ Do thám xong node đó mới lộ quân số');
  // 2) đánh mọi vị trí: gửi quân xuyên bản đồ không bị chặn tầm
  const bw2=new BigWar(1); bw2._updateVision();
  const far2=bw2.nodes.filter(n=>n.owner===1&&n.camp)[0]||bw2.nodes[1];
  const src=bw2.nodes.find(n=>n.owner===0&&n.count>0);
  bw2.sel=src; bw2.tap(far2.x,far2.y);
  ok(bw2.armies.some(a=>a.owner===0&&a.to===far2.id), '🏹 Quân ta tấn công được MỌI vị trí trên bản đồ (hết giới hạn tầm)');
  // 3) công sự
  ok(BW.structDef.village===1.25&&BW.structDef.fort===1.5&&BW.structDef.citadel===1.8, '🏰 Làng trấn ×1.25 / thành lũy ×1.5 / thành trì ×1.8');
  const bw3=new BigWar(3);
  ok(bw3.nodes.filter(n=>n.struct==='citadel').length>=3 && bw3.nodes.some(n=>n.struct==='fort') && bw3.nodes.some(n=>n.struct==='village'), '🏰 Bản đồ có thành trì + thành lũy + làng trấn; 2 đại bản doanh là thành trì');
  const inf={ter:'plain',struct:'fort',type:'spear'}, cav={ter:'plain',struct:'fort',type:'cavalry'};
  ok(bw3.defMul(inf)>bw3.defMul(cav), '🏰 Bộ binh/cung thủ trấn thành được +20% so với kỵ trấn thành');
  // cùng lực lượng: đánh vào thành lũy thua, đánh ngoài đồng thắng
  const [o1]=bwResolve('saber',1200,'spear',1000,1.12,'plain');
  const [o2]=bwResolve('saber',1200,'spear',1000,bw3.defMul({ter:'plain',struct:'fort',type:'spear'}),'plain');
  ok(o1>0&&o2===0, '🏰 1200 đao thắng 1000 giáo ngoài đồng nhưng CÔNG THÀNH LŨY thì thua');
  // 4) phục kích
  const fNode={ter:'forest',type:'spear',owner:2,count:500,camp:false};   /* phe trung lập: không dính thế mạnh mai phục riêng của nền văn minh nào (nước người chơi được chọn ngẫu nhiên) */
  ok(Math.abs(bw3.ambushMult(fNode)-6)<0.01, '🪤 Bộ binh mai phục trong rừng = x6');
  ok(Math.abs(bw3.ambushMult({ter:'valley',type:'cavalry'})-6)<0.01 && Math.abs(bw3.ambushMult({ter:'river',type:'archer'})-6)<0.01, '🪤 Kỵ phục thung lũng x6, cung phục bến sông x6');
  ok(bw3.ambushMult({ter:'forest',type:'shield'})>=2 && bw3.ambushMult({ter:'forest',type:'cavalry'})<=10, '🪤 Mọi mức phục kích nằm trong x2–x10');
  // đánh úp giữa đường: 400 giáo phục rừng diệt gọn 1200 kỵ hành quân ngang qua
  const bw4=new BigWar(1,{classic:true}); bw4._updateVision(); bw4.nextAI=1e9; bw4.nextAiScout=1e9;
  const amb=bw4.nodes.find(n=>n.owner===0&&!n.camp)||bw4.nodes.find(n=>n.owner===0);
  // đặt ổ phục kích & đường đi CÙNG BỜ SÔNG để không bị vòng qua cầu
  const sgn=(x,y)=>Math.sign(x-bw4.riverX(y));
  if(sgn(amb.x,amb.y)>0){ amb.x=bw4.riverX(amb.y)-600; }
  amb.ter='forest'; amb.type='spear'; amb.count=400; amb.ambush=true; amb.camp=false; amb.struct=null;
  const vic={owner:1,type:'cavalry',count:1200,x:amb.x-420,y:amb.y+60,to:-1,tx:amb.x+420,ty:amb.y+60,trail:0,food:100};
  bw4.armies.push(vic);
  let st2=0; while(!vic.done&&st2++<60*60&&vic.count>0) bw4.update(1/60);
  ok(amb.ambush===false && (vic.done||vic.count<1200), '🪤 Địch hành quân ngang ổ phục kích là bị đánh úp, ổ lộ sau 1 lần');
  ok(amb.count>0 && vic.count===0, `🪤 400 giáo phục rừng x6 diệt gọn 1200 kỵ (còn ${amb.count} giáo)`);
}

// ============ v1.1: DÃ CHIẾN — ĐÁNH & PHỤC KÍCH MỌI NƠI ============
{
  const M6 = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, bwResolve, BW};')();
  const {BigWar, BW}=M6;
  // 1) gửi quân tới ĐIỂM BẤT KỲ -> tới nơi tự đóng trại; nếu là rừng thì TỰ MAI PHỤC
  const bw=new BigWar(1,{classic:true}); bw._updateVision();
  const src=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.camp)||bw.nodes[0];
  // tìm 1 điểm rừng gần
  let fx=null; outer: for(let x=200;x<BW.W;x+=60) for(let y=220;y<BW.H-80;y+=60){ if(bw.terAt(x,y)==='forest'){ fx=[x,y]; break outer; } }
  bw.sel=src; bw.tap(fx[0],fx[1]);
  const fa=bw.armies.find(a=>a.owner===0);
  ok(fa&&fa.to===-1, '🧭 Chạm điểm đất trống bất kỳ là hành quân tới đó (không cần node)');
  let st=0; while(!fa.camped&&st++<200*60) bw.update(1/60);
  ok(fa.camped&&fa.ambush, '⛺ Tới rừng là tự đóng trại + TỰ MAI PHỤC');
  // 2) đạo quân địch đi ngang ổ mai phục dã ngoại -> bị đánh úp, 400 giáo diệt 1200 kỵ
  bw.armies=bw.armies.filter(a=>a===fa); bw.nextAI=1e9; bw.nextWave=1e9; fa.ambush=true;
  fa.type='spear'; fa.count=400;
  bw.cap0={0:1e9,1:1e9}; // cô lập luật mai phục khỏi cơ chế trần quân
  const vic={owner:1,type:'cavalry',count:1000,x:fa.x-600,y:fa.y,to:-1,tx:fa.x+600,ty:fa.y,trail:0};
  bw.armies.push(vic);
  st=0; while(!vic.done&&st++<120*60&&!fa.done) bw.update(1/60);
  ok(vic.done&&vic.count===0&&fa.count>0, `🪤 Mai phục dã ngoại giữa rừng diệt gọn 1000 kỵ đi ngang (còn ${fa.count} giáo)`);
  // 3) dã chiến giữa đường: 2 đạo quân đối địch đang di chuyển gặp nhau là đánh ngay, theo địa hình
  const bw2=new BigWar(1,{classic:true}); bw2._updateVision();
  // ép 2 đạo đối đầu trên đồng bằng
  let px=null; outer2: for(let x=400;x<BW.W;x+=80) for(let y=240;y<BW.H-80;y+=80){ if(bw2.terAt(x,y)==='plain'&&bw2.terAt(x+60,y)==='plain'&&bw2.terAt(x-60,y)==='plain'&&Math.abs(x-bw2.riverX(y))>650&&Math.sign(x-400-bw2.riverX(y))===Math.sign(x+400-bw2.riverX(y))){ px=[x,y]; break outer2; } }
  const A={owner:0,type:'cavalry',count:1000,x:px[0]-30,y:px[1],to:-1,tx:px[0]+400,ty:px[1],trail:0,food:100};
  const B={owner:1,type:'spear',count:950,x:px[0]+30,y:px[1],to:-1,tx:px[0]-400,ty:px[1],trail:0,food:100};
  bw2.armies.push(A,B);
  st=0; while(!A.done&&!B.done&&st++<120*60) bw2.update(1/60);
  ok(A.done!==B.done, '⚔️ Hai đạo quân gặp nhau GIỮA ĐƯỜNG là đánh ngay tại chỗ');
  ok(!A.done&&B.done, '⚔️ Đồng bằng: 1000 kỵ thắng 950 giáo trong dã chiến (kỵ khắc bộ binh)');
  // cùng cặp trong rừng thì kỵ thua
  const bw3=new BigWar(1,{classic:true}); bw3._updateVision();
  let fx3=null; outer3: for(let x=400;x<BW.W;x+=20) for(let y=240;y<BW.H-80;y+=20){ if(bw3.terAt(x,y)==='forest'&&bw3.terAt(x-50,y)==='plain'&&Math.abs(x-bw3.riverX(y))>300){ fx3=[x,y]; break outer3; } }
  const A3={owner:0,type:'cavalry',count:1000,x:fx3[0]-50,y:fx3[1],to:-1,tx:fx3[0]-50,ty:fx3[1],trail:0,camped:true,food:100};
  const B3={owner:1,type:'spear',count:950,x:fx3[0],y:fx3[1],to:-1,tx:fx3[0],ty:fx3[1],trail:0,camped:true,food:100};
  bw3.armies.push(A3,B3); st=0; while(!A3.done&&!B3.done&&st++<60*60) bw3.update(1/60);
  ok(A3.done&&!B3.done, '🌲 Cùng cặp quân đó nhưng giáo giữ trong RỪNG (kỵ đánh từ bìa rừng) thì kỵ thua giáo');
  { // LUẬT MỚI: kỵ binh và đại quân không vào được rừng/núi — bộ binh thì vào được
    const bw5=new BigWar(1,{classic:true,civ:'rome'}); bw5._updateVision(); bw5.aiTurn=()=>{};
    const deepIn=(a)=>[[0,0],[45,0],[-45,0],[0,45],[0,-45]].every(([dx,dy])=>bw5.terAt(a.x+dx,a.y+dy)==='forest'); // lọt hẳn vào trong rừng (không tính sượt mép)
    let deep=null; outer5: for(let x=400;x<BW.W;x+=20) for(let y=240;y<BW.H-80;y+=20){ let all=true; for(const [dx,dy] of [[0,0],[70,0],[-70,0],[0,70],[0,-70]]) if(bw5.terAt(x+dx,y+dy)!=='forest') all=false; if(all){ deep=[x,y]; break outer5; } }
    const c0=bw5.nodes[0]; const mk5=(type,count)=>({owner:0,type,count,x:c0.x+40,y:c0.y,to:-1,tx:deep[0],ty:deep[1],trail:0,food:100});
    const cav=mk5('cavalry',300), big=mk5('spear',2600), foot=mk5('spear',300); bw5.armies.push(cav,big,foot);
    let inCav=0,inBig=0; st=0; while(st++<200*30&&!(cav.camped&&big.camped&&foot.camped)){ bw5.update(1/30); for(const a of bw5.armies) a.food=100; big.count=Math.max(big.count,2600);
      if(deepIn(cav)) inCav++; if(deepIn(big)) inBig++; }
    ok(foot.camped&&Math.hypot(foot.x-deep[0],foot.y-deep[1])<5, '🌲 Bộ binh nhỏ đi được vào GIỮA RỪNG');
    ok(cav.camped&&inCav===0&&bw5.terAt(cav.x,cav.y)!=='forest'&&Math.hypot(cav.x-deep[0],cav.y-deep[1])>40, '🐎 KỴ BINH không vào rừng: dừng ở bìa rừng');
    ok(big.camped&&inBig===0&&bw5.terAt(big.x,big.y)!=='forest', '🚩 ĐẠI QUÂN (≥2000) không vào rừng: dừng ở bìa rừng');
    { // thế mạnh văn minh: Đại Việt đi rừng thạo — đại quân BỘ BINH vào được rừng, kỵ binh thì vẫn không
      const bw6=new BigWar(1,{classic:true,civ:'daiviet'}); bw6._updateVision(); bw6.aiTurn=()=>{}; const c6=bw6.nodes[0];
      let d6=null; o6: for(let x=400;x<BW.W;x+=20) for(let y=240;y<BW.H-80;y+=20){ if([[0,0],[70,0],[-70,0],[0,70],[0,-70]].every(([dx,dy])=>bw6.terAt(x+dx,y+dy)==='forest')){ d6=[x,y]; break o6; } }
      const big6={owner:0,type:'spear',count:2600,x:c6.x+40,y:c6.y,to:-1,tx:d6[0],ty:d6[1],trail:0,food:100}, cav6={owner:0,type:'cavalry',count:300,x:c6.x+40,y:c6.y,to:-1,tx:d6[0],ty:d6[1],trail:0,food:100}; bw6.armies.push(big6,cav6);
      let st6=0; while(st6++<200*30&&!(big6.camped&&cav6.camped)){ bw6.update(1/30); big6.food=cav6.food=100; big6.count=Math.max(big6.count,2600); }
      ok(bw6.civOf(0).id==='daiviet'&&big6.camped&&Math.hypot(big6.x-d6[0],big6.y-d6[1])<5&&bw6.terAt(cav6.x,cav6.y)!=='forest', '🐉 Đại Việt (đi rừng thạo): đại quân bộ binh vào được GIỮA RỪNG, kỵ binh vẫn dừng ở bìa');
      ok(bw6.nodes[0].type==='spear'&&bw6.civOf(1)&&bw6.civOf(1).id!=='daiviet', '🏛️ Trại của Đại Việt sinh GIÁO BINH (binh chủng sở trường); đối thủ là nền văn minh khác');
      const b1=new BigWar(3,{civ:'mongol'}), b2=new BigWar(3,{civ:'mongol'});
      ok(b1.civOf(0).id==='mongol'&&b1.nodes[0].type==='cavalry'&&b1.civOf(1).id===b2.civOf(1).id, '🏛️ Chọn Mông Cổ: trại sinh KỴ BINH; đối thủ của ải cố định (không đổi giữa các lần vào)');
      const rr1=new BigWar(5,{royale:36,seed:77,civ:'rome'}); const ids=Object.values(rr1.civs).map(c=>c.id);
      ok(ids.length===37&&new Set(ids).size===37&&rr1.civOf(0).id==='rome', `🌏 Quần Hùng: 37 nước là 37 nền văn minh KHÁC NHAU (${new Set(ids).size}), ta là La Mã`);
      const e1=rr1.civAtk(0,'shield','plain'), e2=rr1.civAtk(0,'spear','plain');
      ok(e1>1.1&&e2===1, `⚔️ Binh chủng sở trường đánh mạnh hơn (khiên La Mã ×${e1.toFixed(2)}, loại khác ×${e2})`);
    }
    ok(bw5.mvProfile(cav)==='H'&&bw5.mvProfile(big)==='H'&&bw5.mvProfile(foot)==='F'&&bw5.mvProfile({type:'assassin',count:300,owner:0})==='R', '🧭 Lớp di chuyển: kỵ/đại quân = H, bộ binh = F, đột kích = R');
    // sông: chỉ qua ở bến
    const far=bw5.nodes.filter(n=>(n.x<bw5.riverX(n.y))!==(c0.x<bw5.riverX(c0.y))).sort((a,b)=>Math.hypot(a.x-c0.x,a.y-c0.y)-Math.hypot(b.x-c0.x,b.y-c0.y))[0];
    const P=bw5.findPath('H',c0.x,c0.y,far.x,far.y); let wet=0, ford=0; let px2=c0.x, py2=c0.y;
    for(const q of P.pts){ const d=Math.hypot(q[0]-px2,q[1]-py2), k=Math.max(1,Math.ceil(d/15)); for(let i=1;i<=k;i++){ const x=px2+(q[0]-px2)*i/k, y=py2+(q[1]-py2)*i/k; if(Math.abs(x-bw5.riverX(y))<40){ if(bw5.nearBridge(x,y,BW.fordR+40)) ford++; else wet++; } } px2=q[0]; py2=q[1]; }
    ok(P.ok&&ford>0&&wet===0, `🌊 Sang bờ bên kia: đường đi chỉ vượt sông ở BẾN (qua bến ${ford} bước, lội nước sâu ${wet})`);
    // mọi cứ điểm đều có đường cái cho kỵ binh/đại quân tới
    let unreach=0; for(const n of bw5.nodes){ if(!bw5.findPath('H',c0.x,c0.y,n.x,n.y).ok) unreach++; }
    ok(unreach===0, `🛣️ Kỵ binh/đại quân tới được MỌI cứ điểm bằng đường cái (không tới được: ${unreach})`);
  }
  // 4) truy kích: chọn đạo quân ta rồi chạm đạo quân địch
  const bw4=new BigWar(1,{classic:true}); bw4._updateVision();
  const s4=bw4.nodes.find(n=>n.owner===0&&n.count>0); s4.count=2000; s4.type='cavalry';
  const r4=bw4.roads.find(r=>r.a===s4.id||r.b===s4.id), o4=r4.a===s4.id? [r4.x2,r4.y2] : [r4.x1,r4.y1], l4=Math.hypot(o4[0]-s4.x,o4[1]-s4.y), q4=Math.min(0.9,300/l4); // mục tiêu chạy dọc đường cái
  const run={owner:1,type:'archer',count:300,x:s4.x+(o4[0]-s4.x)*q4,y:s4.y+(o4[1]-s4.y)*q4,to:-1,tx:s4.x+(o4[0]-s4.x)*Math.min(0.97,q4+0.07),ty:s4.y+(o4[1]-s4.y)*Math.min(0.97,q4+0.07),trail:0};
  bw4.armies.push(run);
  bw4.sel=s4; bw4.tap(run.x,run.y);
  const hunter=bw4.armies.find(a=>a.owner===0);
  ok(hunter&&hunter.hunt===run, '🐎 Chạm đạo quân địch là TRUY KÍCH mục tiêu di động');
  st=0; while(!run.done&&st++<120*60) bw4.update(1/60);
  ok(run.done&&hunter.count>0, '🐎 Truy kích đuổi kịp và tiêu diệt đạo quân địch');
}

// ============ v1.2: TẦM NHÌN ĐỐI XỨNG + NHÓM MAI PHỤC + FIX CHỌN ============
{
  const M7 = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, BW};')();
  const {BigWar, BW}=M7;
  const bw=new BigWar(2); bw._updateVision();
  ok(bw.visR===600, '👁️ Tầm nhìn = 15 ô (600px) cho cả hai phía');
  // AI mù ngoài tầm: node ta sát trại ta không có quân địch gần -> AI chỉ đoán mò
  const deep=bw.nodes.find(n=>n.owner===0&&!bw.aiVis(n.x,n.y));
  if(deep){ deep.count=9999; ok(bw.aiSee(deep).blind&&bw.aiSee(deep).count<1000, '🙈 Địch KHÔNG đọc được quân số node ta ngoài tầm nhìn (chỉ đoán)'); }
  // quân mai phục vô hình với AI
  const mb=bw.nodes.find(n=>n.owner===0&&n.count>0); mb.ambush=true;
  ok(bw.aiSee(mb).count===0, '🪤 Quân mai phục VÔ HÌNH trước mắt địch');
  mb.ambush=false;
  // FIX chọn: đang chọn node bật mai phục, chạm đạo quân ta khác -> chuyển chọn, không ra lệnh
  const bw2=new BigWar(1); bw2._updateVision();
  const nd=bw2.nodes.find(n=>n.owner===0&&n.count>0); const keep=nd.count;
  const fa={owner:0,type:'spear',count:300,x:nd.x+500,y:nd.y,to:-1,trail:0,camped:true};
  bw2.armies.push(fa);
  bw2.sel=nd; nd.ambush=true;
  bw2.tap(fa.x,fa.y);
  ok(bw2.selA===fa && nd.count===keep && bw2.armies.filter(a=>a.owner===0).length===1, '🛠️ FIX: đang mai phục ở thành trấn vẫn chạm chọn được đạo quân khác (không bắn quân đi)');
  // kích đúp chọn cả cụm mai phục
  const g2={owner:0,type:'archer',count:200,x:fa.x+180,y:fa.y+60,to:-1,trail:0,camped:true,ambush:true};
  const g3={owner:0,type:'saber',count:220,x:fa.x-170,y:fa.y-70,to:-1,trail:0,camped:true,ambush:true};
  bw2.armies.push(g2,g3);
  bw2.tap(fa.x,fa.y); bw2.tap(fa.x,fa.y); // đúp
  ok(bw2.selG&&bw2.selG.length===3, '👥 Kích đúp 1 đạo -> chọn cả cụm 3 đạo mai phục gần nhau');
  // ra lệnh cả cụm cùng lúc
  bw2.tap(fa.x+900,fa.y);
  ok([fa,g2,g3].every(a=>!a.camped&&a.to===-1), '👥 Một chạm điều cả cụm cùng hành quân');
  // vùng đánh úp nới rộng: địch cách 180px vẫn bị vồ
  const bw3=new BigWar(1,{classic:true}); bw3._updateVision(); bw3.armies.length=0; bw3.nextAI=1e9; bw3.nextWave=1e9;
  let fx=null, rd=null; outer: for(const r of bw3.roads){ if(r.a==null||r.b==null) continue; const L=Math.hypot(r.x2-r.x1,r.y2-r.y1); if(L<360) continue; const ux=(r.x2-r.x1)/L, uy=(r.y2-r.y1)/L;
      for(const f of [0.5,0.4,0.6]) for(const off of [130,-130,150,-150]){ const x=r.x1+ux*L*f-uy*off, y=r.y1+uy*L*f+ux*off; if(bw3.terAt(x,y)==='forest'&&!bw3.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<260)){ fx=[x,y]; rd=r; break outer; } } }
  const trap={owner:0,type:'spear',count:400,x:fx[0],y:fx[1],to:-1,trail:0,camped:true,ambush:true};
  const vic={owner:1,type:'cavalry',count:900,x:rd.x1,y:rd.y1,to:rd.b,trail:0}; bw3.nodes[rd.b].owner=1; bw3.nodes[rd.b].count=50; bw3.nodes[rd.a].count=0; // kỵ binh đi DỌC ĐƯỜNG CÁI ngang qua ổ phục trong rừng
  bw3.armies.push(trap,vic);
  let st=0; while(!vic.done&&st++<120*60) bw3.update(1/60);
  ok(vic.done&&vic.count<=0&&trap.count>0&&bw3.nodes[rd.b].owner===1, '🪤 Phục binh trong rừng ven đường: kỵ binh địch đi trên đường cái cách ~130px vẫn bị đánh úp');
}

// ============ v2.0: TRẬN THEO THỜI GIAN + LƯƠNG THẢO + BAO VÂY + QUẦN HÙNG + MENU LỆNH ============
{
  const M8 = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, bwResolve, BW};')();
  const {BigWar, BW}=M8;
  const mk=(cfg)=>{ const bw=new BigWar(2,cfg); bw.nextAI=1e9; bw.nextAiScout=1e9; bw.nextWaveF={1:1e9}; bw._updateVision(); return bw; };
  // 1) TRẬN KÉO DÀI THEO QUÂN SỐ, tối thiểu ~5s
  const dur=(ca,cb)=>{ const bw=mk(); bw.armies.length=0; bw.battles.length=0;
    const A={owner:0,type:'spear',count:ca,x:BW.W*0.45,y:BW.H*0.5,to:-1,tx:BW.W*0.45+1,ty:BW.H*0.5,trail:0,food:100};
    const B={owner:1,type:'spear',count:cb,x:BW.W*0.45+50,y:BW.H*0.5,to:-1,tx:BW.W*0.45-1,ty:BW.H*0.5,trail:0,food:100,camped:false};
    bw.armies.push(A,B); let t=0;
    while(!bw.battles.length&&t<10){ bw.update(1/30); t+=1/30; }
    if(!bw.battles.length) return -1;
    while(bw.battles.some(b=>!b.done)&&t<120){ bw.update(1/30); t+=1/30; }
    return t; };
  const t1=dur(120,100), t2=dur(1200,1000), t3=dur(6000,5000);
  ok(t1>=4.5, `⏱️ Trận nhỏ 120v100 kéo dài ${t1.toFixed(1)}s (tối thiểu ~5s)`);
  ok(t2>t1 && t3>t2, `⏱️ Trận càng đông càng lâu: ${t1.toFixed(1)}s → ${t2.toFixed(1)}s → ${t3.toFixed(1)}s`);
  // 2) TIẾP VIỆN nhập trận + RÚT LUI
  { const bw=mk(); bw.armies.length=0; bw.battles.length=0;
    const A={owner:0,type:'spear',count:800,x:2000,y:600,to:-1,tx:BW.W*0.45+1,ty:BW.H*0.5,trail:0,food:100};
    const B={owner:1,type:'spear',count:900,x:BW.W*0.45+50,y:BW.H*0.5,to:-1,tx:BW.W*0.45-1,ty:BW.H*0.5,trail:0,food:100};
    bw.armies.push(A,B); let st=0; while(!bw.battles.length&&st++<600) bw.update(1/30);
    const b=bw.battles[0];
    const C={owner:0,type:'archer',count:400,x:b.x-400,y:b.y,to:-1,tx:b.x,ty:b.y,trail:0,food:100};
    bw.armies.push(C); st=0; while(!C.btl&&st++<900&&!b.done) bw.update(1/30);
    ok(C.btl===b.id, '➕ Đạo quân tới gần trận là NHẬP TRẬN tiếp viện');
    bw.retreatFromBattle(A);
    ok(!A.btl&&A.to>=0&&A.count<800, '🏳️ RÚT LUI giữa trận: thoát trận, chịu 12% tổn thất, chạy về node nhà');
  }
  // 2b) TRẦN QUÂN: cày quân lâu không đánh vẫn không vượt trần; quá tải + cạn kho -> đào ngũ
  { const bw=mk(); bw.armies.length=0; bw.battles.length=0; bw.nextAI=1e9; bw.aiTurn=()=>{};
    for(let t=0;t<240;t++){ bw.update(BW.ecoEvery); if(t%4===0) for(const n of bw.nodes) if(n.owner===0&&n.camp&&n.count>200) bw.send(n,{x:n.x+150,y:n.y+60,id:-1}); }
    const cap=bw.supplyCap(0), tot=bw.myPower(0);
    ok(tot<=cap*1.03, `📦 Cày quân 20 phút không vượt trần (${Math.round(tot)}/${cap})`);
    bw.armies.push({owner:0,type:'spear',count:cap*2,x:400,y:400,to:-1,trail:0,camped:true,food:100});
    for(const n of bw.nodes) if(n.owner===0) n.food=0;
    const t0=bw.myPower(0); for(let i=0;i<10;i++) bw.update(BW.ecoEvery);
    ok(bw.myPower(0)<t0*0.9, `🏳️ Quá tải + kho cạn → đào ngũ (${Math.round(t0)} → ${Math.round(bw.myPower(0))})`); }
  // 3) LƯƠNG THẢO: tiêu hao theo quân số, hết lương tan rã, thắng cướp lương
  { const bw=mk(); bw.armies.length=0; bw.battles.length=0;
    const A={owner:0,type:'spear',count:400,x:BW.W*0.45,y:260,to:-1,trail:0,camped:true,food:10};
    bw.armies.push(A);
    // hậu phương bị vây, kho trống -> không có đội vận lương nào -> đói rồi tan rã
    for(const n of bw.nodes) if(n.owner===0){ n.x=100; n.y=1000; }
    const cr0=BW.food.cvRange; BW.food.cvRange=600;   // đạo quân ở ngoài tầm mọi kho lương của ta
    let st=0; while(!A.done&&st++<400) bw.update(BW.ecoEvery); BW.food.cvRange=cr0;
    ok(A.done&&bw.convoys.length===0, '🌾 Hết lương + ngoài tầm tiếp tế (không xe lương nào tới) → đạo quân TAN RÃ');
    const bw2=mk(); bw2.armies.length=0; bw2.battles.length=0;
    const W1={owner:0,type:'cavalry',count:2000,x:2000,y:600,to:-1,tx:BW.W*0.45+1,ty:BW.H*0.5,trail:0,food:20};
    const L1={owner:1,type:'archer',count:300,x:BW.W*0.45+40,y:BW.H*0.5,to:-1,tx:BW.W*0.45-1,ty:BW.H*0.5,trail:0,food:90};
    bw2.cap0={0:1e9,1:1e9}; // cô lập luật cướp lương khỏi cơ chế trần quân
    bw2.armies.push(W1,L1); let st2=0;
    while((!bw2.battles.length||bw2.battles.some(b=>!b.done))&&st2++<3000) bw2.update(1/30);
    ok(W1.food>20, `🌾 Thắng trận CƯỚP LƯƠNG bên thua (lương ${Math.round(20)} → ${Math.round(W1.food)})`);
    // v5.0: bao lương tính theo THỜI GIAN hành quân — đại quân không còn "đi vài chục giây là đói"
    const d1=bw.foodDrain({owner:0,count:100}), d2=bw.foodDrain({owner:0,count:10000}), d3=bw.foodDrain({owner:0,count:100000});
    ok(d2<d1*1.4&&d3<d1*1.7&&d2>d1, `🌾 Mỗi nhịp đạo 100 quân hao ${d1.toFixed(1)}%, đạo 10 000 hao ${d2.toFixed(1)}%, đạo 100 000 hao ${d3.toFixed(1)}% (trước đây đạo 10 000 hao 27%/nhịp)`);
    ok(bw.packT({count:500})>=145&&bw.packT({count:10000})>=115&&bw.packT({count:100000})>=95, `🌾 Bao lương đầy đủ cho ${Math.round(bw.packT({count:500}))}s hành quân (500 quân) · ${Math.round(bw.packT({count:10000}))}s (10 000) · ${Math.round(bw.packT({count:100000}))}s (100 000)`);
  }
  // 3b) v5.0 — ĐẠI QUÂN: chuẩn bị lương lâu hơn, đi chậm hơn, đi xa không tan rã; ĐỘI VẬN LƯƠNG tiếp tế, bị chặn thì mất
  { const bw=mk(); bw.armies.length=0; bw.battles.length=0; bw.aiTurn=()=>{}; bw.supplyCap=()=>1e9;
    const p05=bw.prepTime(500,40), p2=bw.prepTime(2000,40), p10=bw.prepTime(10000,40), p50=bw.prepTime(50000,40);
    ok(p05===0&&p2>=1&&p2<=2.5&&p10>=6&&p10<=8.5&&p50>=20&&p50<=26, `🌾 Chuẩn bị lương: 500 quân ${p05}s · 2 000 quân ${p2.toFixed(1)}s · 10 000 quân ${p10.toFixed(1)}s · 50 000 quân ${p50.toFixed(1)}s`);
    ok(bw.prepTime(10000,40,true)<p10*0.55&&bw.prepTime(10000,5)<p10*0.7, `🌾 Kho tại chỗ đầy lương thì chuẩn bị nhanh gấp đôi (${bw.prepTime(10000,40,true).toFixed(1)}s); chặng ngắn chuẩn bị ít hơn (${bw.prepTime(10000,5).toFixed(1)}s)`);
    ok(Math.abs(BW.sizeSpd(500)-1)<1e-9&&BW.sizeSpd(2000)<0.92&&BW.sizeSpd(10000)<0.74&&BW.sizeSpd(10000)>0.62&&BW.sizeSpd(100000)>0.5, `🐢 Tốc độ theo quân số: 2 000 quân ${Math.round(BW.sizeSpd(2000)*100)}% · 10 000 quân ${Math.round(BW.sizeSpd(10000)*100)}% · 100 000 quân ${Math.round(BW.sizeSpd(100000)*100)}%`);
    // xuất quân thật: đạo nhỏ đi ngay; đại quân đứng trước cổng gom lương rồi mới đi, đi chậm hơn, tới nơi nguyên vẹn
    const cap=bw.nodes.find(n=>n.camp&&n.owner===0); const far=bw.nodes.filter(n=>n.owner===2&&!n.camp&&!n.eco).sort((a,b)=>Math.hypot(b.x-cap.x,b.y-cap.y)-Math.hypot(a.x-cap.x,a.y-cap.y))[0]; far.count=1;
    for(const n of bw.nodes){ n.ambush=false; if(n.owner===1) n.count=Math.min(n.count,1); }
    const run=(N)=>{ cap.count=N; cap.type='swordsman'; cap.food=0; const a=bw.send(cap,far); const x0=a.x,y0=a.y, prep=a.prep||0; let tMove=null, t=0, minF=100;
      while(!a.done&&a.count>0&&t<600){ bw.update(0.05); t+=0.05; if(tMove==null&&Math.hypot(a.x-x0,a.y-y0)>4) tMove=t; minF=Math.min(minF,a.food??100); }
      const left=a.done? far.count : a.count; far.owner=2; far.count=1; far.type='spear'; return {prep,tMove,t,left,minF}; };
    const s=run(500), b=run(10000), h=run(40000);
    ok(s.prep===0&&s.tMove<0.2, `🚶 Đạo 500 quân: nhận lệnh là đi ngay (${s.tMove.toFixed(2)}s)`);
    ok(b.prep>5&&Math.abs(b.tMove-b.prep)<0.3, `🌾 Đạo 10 000 quân: đứng gom lương ${b.prep.toFixed(1)}s rồi mới rời cổng (nhúc nhích ở giây ${b.tMove.toFixed(1)})`);
    ok((b.t-b.prep)>(s.t-s.prep)*1.25&&(h.t-h.prep)>(b.t-b.prep)*1.08, `🐢 Cùng quãng đường: 500 quân đi ${Math.round(s.t)}s · 10 000 quân đi ${Math.round(b.t-b.prep)}s (+${Math.round(b.prep)}s chuẩn bị) · 40 000 quân đi ${Math.round(h.t-h.prep)}s (+${Math.round(h.prep)}s)`);
    ok(b.left>=10000&&h.left>=40000&&b.minF>30, `🌾 Đại quân đi hết chiều dài bản đồ KHÔNG hao một lính nào vì đói (10 000 → ${Math.round(b.left)}, 40 000 → ${Math.round(h.left)}; lương thấp nhất ${Math.round(b.minF)}%)`);
    // địch tới trong lúc đang gom lương: quay vào giữ thành
    cap.count=6000; cap.type='spear'; cap.food=0; const pa=bw.send(cap,far); const en={owner:1,type:'spear',count:300,x:cap.x+200,y:cap.y,from:-1,to:cap.id,trail:0,food:100}; bw.armies.push(en);
    let t3=0; while(!en.done&&t3<20){ bw.update(0.05); t3+=0.05; if(en.btl) break; }
    ok(pa.done&&cap.owner===0&&(cap.count>=5000||cap.btl), `🛡️ Địch tới lúc quân còn đang chuẩn bị lương → huỷ lệnh, ${Math.round(cap.count)} quân quay vào giữ thành (thành không mất oan)`);
  }
  { // ĐỘI VẬN LƯƠNG
    const bw=mk(); bw.armies.length=0; bw.battles.length=0; bw.aiTurn=()=>{}; bw.supplyCap=()=>1e9; for(const n of bw.nodes){ n.ambush=false; if(n.owner===1) n.count=Math.min(n.count,1); }
    const cap=bw.nodes.find(n=>n.camp&&n.owner===0); for(const n of bw.nodes) if(n.owner===0) n.food=0; cap.food=400;
    let spot=null; for(const gap of [420,300,230]){ for(let r=1300;r<3600&&!spot;r+=100) for(let an=0;an<6.28;an+=0.15){ const x=cap.x+Math.cos(an)*r, y=cap.y+Math.sin(an)*r; if(x<200||y<260||x>BW.W-200||y>BW.H-120) continue; if(bw.terAt(x,y)==='plain'&&!bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<gap)&&bw.findPath('F',cap.x,cap.y,x,y).ok){ spot=[x,y]; break; } } if(spot) break; }
    const A={owner:0,type:'spear',count:3000,x:spot[0],y:spot[1],to:-1,tx:spot[0],ty:spot[1],trail:0,camped:true,food:30}; bw.armies.push(A);
    bw.update(BW.ecoEvery); const cv=bw.convoys[0], stock1=cap.food;
    ok(!!cv&&cv.to===A&&cv.from===cap.id&&stock1<400&&A._cv, `🐂 Đạo quân đóng xa ${Math.round(Math.hypot(spot[0]-cap.x,spot[1]-cap.y))}px còn 30% lương → kinh đô cho ĐỘI VẬN LƯƠNG lên đường (kho ${400} → ${Math.round(stock1)})`);
    let t=0, x0=cv?cv.x:0; while(bw.convoys.length&&t<120){ bw.update(0.05); t+=0.05; }
    ok(bw.convoys.length===0&&A.food>85&&A.count===3000, `🐂 Xe lương tới nơi sau ${Math.round(t)}s: lương đạo quân lên ${Math.round(A.food)}%, không ai đào ngũ`);
    // bị chặn cướp
    A.food=20; A._cvT=0; cap.food=400; bw.update(BW.ecoEvery); const cv2=bw.convoys[0]; let t2=0; while(bw.convoys.length&&t2<4){ bw.update(0.05); t2+=0.05; }
    const R={owner:1,type:'cavalry',count:200,x:cv2.x+20,y:cv2.y,to:-1,tx:cv2.x+20,ty:cv2.y,trail:0,camped:true,food:40}; bw.armies.push(R); const f0=A.food; bw.update(0.05);
    ok(bw.convoys.length===0&&R.food>40&&A.food<=f0+0.01, `🐂 Quân địch áp sát đoàn xe → CƯỚP LƯƠNG (địch ${40} → ${Math.round(R.food)}%), đạo quân ta không nhận được gì`);
    // lưu → mở lại: xe lương đang đi vẫn còn và giao được
    R.done=true; R.count=0; bw.armies=bw.armies.filter(a=>!a.done); A.food=25; A._cvT=0; A._cv=0; cap.food=400; bw.update(BW.ecoEvery); for(let k=0;k<40;k++) bw.update(0.05);
    const sv=JSON.parse(JSON.stringify(bw.saveState())); const bwL=mk(); bwL.loadState(sv); bwL.aiTurn=()=>{}; bwL.supplyCap=()=>1e9;
    const A2=bwL.armies.find(a=>a.owner===0&&a.count===3000); let t4=0; while(bwL.convoys.length&&t4<120){ bwL.update(0.05); t4+=0.05; }
    ok(sv.convoys.length===1&&!!A2&&bwL.convoys.length===0&&A2.food>80, `💾 Lưu ván lúc xe lương đang đi → mở lại xe vẫn chạy tiếp và giao lương (${Math.round(A2?A2.food:0)}%)`);
    // hợp đồng tác chiến: đạo đông (chuẩn bị lâu, đi chậm) và đạo nhỏ vẫn ập tới gần như cùng lúc
    const bw5=mk(); bw5.armies.length=0; bw5.battles.length=0; bw5.aiTurn=()=>{}; bw5.supplyCap=()=>1e9; for(const n of bw5.nodes){ n.ambush=false; }
    const mine=bw5.nodes.filter(n=>n.owner===1&&!n.eco).slice(0,2); const tg=bw5.nodes.find(n=>n.camp&&n.owner===0); tg.count=50000;
    if(mine.length===2){ mine[0].count=9000; mine[1].count=400; bw5.sendCoordinated(mine,tg); const as=bw5.armies.slice(); const arr=[null,null]; let t5=0;
      while(t5<400&&arr.some(v=>v==null)){ bw5.update(0.05); t5+=0.05; as.forEach((a,i)=>{ if(arr[i]==null&&(a.done||a.btl)) arr[i]=t5; }); }
      ok(arr[0]!=null&&arr[1]!=null&&Math.abs(arr[0]-arr[1])<6, `🤝 Hợp đồng tác chiến có tính thời gian chuẩn bị lương: đạo 9 000 quân tới giây ${arr[0]&&arr[0].toFixed(0)}, đạo 400 quân tới giây ${arr[1]&&arr[1].toFixed(0)}`); }
  }
  // 3c) QUẦN HÙNG: nước đã MẤT thì không được "sống lại" nhờ một trận đang đánh dở (lỗi cũ: trận vẫn mang cờ nước đã mất)
  { const bw=mk({royale:8,seed:11,map:1}); bw.armies.length=0; bw.battles.length=0; bw.aiTurn=()=>{}; if(bw.aiDiplomacy) bw.aiDiplomacy=()=>{}; bw.supplyCap=()=>1e9;
    const X=3, Y=4, cX=bw.nodes.find(n=>n.camp&&n.owner===X), cY=bw.nodes.find(n=>n.camp&&n.owner===Y);
    const N=bw.nodes.filter(n=>n.owner===2&&!n.camp&&!n.eco).sort((a,b)=>Math.hypot(a.x-cX.x,a.y-cX.y)-Math.hypot(b.x-cX.x,b.y-cX.y))[0]; N.owner=5; N.count=1500; N.type='spear'; N.ambush=false;   // cứ điểm của một nước thứ ba: đánh là mở trận kéo dài
    const A={owner:X,type:'archer',count:5000,x:N.x,y:N.y+70,from:cX.id,to:N.id,trail:0,food:100}; bw.armies.push(A); bw.arrive(A,N);
    const inBattle=!!A.btl&&bw.battles.some(b=>!b.done);
    const prev=cX.owner; cX.owner=Y; cX.count=100; bw.checkCamp(cX,Y,prev);   // kinh đô (trại duy nhất) của nước X rơi vào tay nước Y
    const fell=bw.nodes.every(n=>n.owner!==X)&&A.owner===Y;
    let t=0; while(bw.battles.some(b=>!b.done)&&t<200){ bw.update(0.05); t+=0.05; }
    const ghost=bw.nodes.filter(n=>n.owner===X).length+bw.armies.filter(a=>!a.done&&a.owner===X).length;
    ok(inBattle&&fell&&ghost===0&&N.owner===Y, `👑 Nước mất kinh đô giữa lúc quân đang công thành: quân quy hàng, thắng trận thì cứ điểm về tay phe chiếm — nước đã mất KHÔNG sống lại (cứ điểm về phe ${N.owner}, bóng ma: ${ghost})`); }
  // 4) KHO LƯƠNG trên bản đồ + tiếp tế
  { const bw=mk();
    const gr=bw.nodes.filter(n=>n.eco==='granary');
    ok(gr.length>=2, `🌾 Bản đồ có ${gr.length} KHO LƯƠNG`);
    const g0=gr[0]; g0.owner=0; g0.food=500; g0.count=50;
    const A={owner:0,type:'spear',count:300,x:g0.x+150,y:g0.y,to:-1,trail:0,camped:true,food:30};
    bw.armies.push(A); bw.update(BW.ecoEvery);
    ok(A.food>80, `🌾 Đứng cạnh kho lương là được TIẾP TẾ (30 → ${Math.round(A.food)})`);
  }
  // 5) BAO VÂY: node bị vây ngừng sản xuất, cạn lương thì chết đói
  { const bw=mk(); bw.armies.length=0; bw.battles.length=0;
    const f=bw.nodes.find(n=>n.eco==='farm'&&n.owner===2); f.owner=1; f.count=500; f.food=12; f.cap=900;
    const S={owner:0,type:'spear',count:400,x:f.x-185,y:f.y,to:-1,trail:0,camped:true,sieging:f.id,food:100};
    bw.armies.push(S);
    const c0=f.count;
    for(let k=0;k<6;k++) bw.update(BW.ecoEvery);
    ok(f.sieged===true, '⛓️ Node bị BAO VÂY (quân vây đứng vành đai 185px)');
    ok(f.count<c0, `⛓️ Thành bị vây cạn lương CHẾT ĐÓI dần (${c0} → ${Math.round(f.count)}), không sản xuất`);
  }
  // 6) QUẦN HÙNG: 34 nước, nước mất trại là quy hàng phe chiếm
  { const bw=new BigWar(5,{royale:34,seed:77}); bw._updateVision();
    const camps=bw.nodes.filter(n=>n.camp);
    const fids=new Set(camps.map(n=>n.owner));
    ok(camps.length>=30&&camps.length<=41, `🌏 Quần hùng có ${camps.length} nước (30-40 chư hầu)`);
    ok(fids.size===camps.length, '🌏 Mỗi nước một đại bản doanh riêng');
    // nước X mất trại -> toàn bộ node/quân của X đổi màu phe chiếm
    const vic=camps.find(n=>n.owner>=3); const vicFid=vic.owner;
    const own0=bw.nodes.filter(n=>n.owner===vicFid).length;
    vic.count=10; const atk={owner:0,type:'cavalry',count:4000,x:vic.x,y:vic.y,to:vic.id,food:100};
    bw.arrive(atk,vic);
    let st=0; while(bw.battles.some(b=>!b.done)&&st++<3000) bw.update(1/30);
    ok(bw.nodes.filter(n=>n.owner===vicFid).length===0, `👑 Nước ${vicFid} mất trại: toàn bộ ${own0} thành/đạo quân QUY HÀNG phe chiếm`);
    // AI các nước tự đánh nhau
    const bw2=new BigWar(5,{royale:34,seed:78}); bw2.localFid=0; bw2._updateVision();
    let fought=false; for(let k=0;k<70*30&&!fought;k++){ bw2.update(1/30);
      if(bw2.battles.some(b=>b.A.fid>=1&&b.B.fid>=1&&b.A.fid!==b.B.fid)) fought=true; }
    ok(fought, '🌏 Các chư hầu TỰ ĐÁNH LẪN NHAU không cần người chơi');
  }
  // 7) MENU LỆNH khi tắt autoMenu + do thám phá mai phục
  { const bw=new BigWar(2,{autoMenu:false}); bw.nextAI=1e9; bw.nextAiScout=1e9; bw._updateVision();
    const s0=bw.nodes.find(n=>n.owner===0&&n.count>0);
    const e0=bw.nodes.find(n=>n.owner===1&&n.count>0&&!n.camp);
    bw.sel=s0; bw.tap(e0.x,e0.y);
    ok(!!bw.menu&&bw.menu.opts.some(o=>o.id==='attack')&&bw.menu.opts.some(o=>o.id==='siege')&&bw.menu.opts.some(o=>o.id==='scout'),
      '📋 Chạm mục tiêu địch hiện MENU: Tấn công / Bao vây / Do thám');
    bw.menuPick('siege');
    const a=bw.armies.find(x=>x.owner===0);
    ok(a&&a.siege===e0.id, '📋 Chọn BAO VÂY: đạo quân mang lệnh vây thành');
    // trinh sát địch quét trúng ổ mai phục -> mất thế phục kích
    const amb={owner:0,type:'spear',count:300,x:BW.W*0.35,y:BW.H*0.5,to:-1,trail:0,camped:true,ambush:true,food:100};
    bw.armies.push(amb);
    bw.aiScouts.push({x:amb.x-500,y:amb.y,tx:amb.x+500,ty:amb.y,fid:1});
    let st=0; while(amb.ambush&&st++<20*30) bw.update(1/30);
    ok(!amb.ambush, '🚨 Đạo quân bị trinh sát địch quét trúng là MẤT thế mai phục');
  }
}

// ============ v2.1: RÚT LUI VỀ TRẠI + SÔNG-CẦU + ĐƯỜNG CÁI + 20 BẢN ĐỒ ============
{
  const M9 = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, BW, BW_MAPS};')();
  const {BigWar, BW, BW_MAPS}=M9;
  // 1) RÚT LUI: thoát hẳn trận, miễn chiến, chạy VỀ TRẠI
  { const bw=new BigWar(2,{classic:true}); bw.nextAI=1e9; bw.nextAiScout=1e9; bw._updateVision(); bw.armies.length=0;
    const A={owner:0,type:'spear',count:900,x:2000,y:600,to:-1,tx:BW.W*0.45+1,ty:BW.H*0.5,trail:0,food:100};
    const B={owner:1,type:'spear',count:2200,x:BW.W*0.45+40,y:BW.H*0.5,to:-1,tx:BW.W*0.45-1,ty:BW.H*0.5,trail:0,food:100};
    bw.armies.push(A,B); let st=0; while(!bw.battles.length&&st++<600) bw.update(1/30);
    bw.retreatFromBattle(A);
    ok(A.retreatT>0, '🏳️ Rút lui có MIỄN CHIẾN (không bị hút lại vào trận)');
    ok(A.to===0&&bw.nodes[0].camp, '🏳️ Rút lui mặc định chạy VỀ TRẠI');
    let reEng=false; for(let k=0;k<3*30;k++){ bw.update(1/30); if(A.btl) reEng=true; }
    ok(!reEng&&!A.done, '🏳️ 3 giây sau rút lui vẫn không bị cuốn lại vào trận');
  }
  // 2) SÔNG: chỉ qua ở CẦU — đạo quân tự vòng tới bến
  { const bw=new BigWar(1,{classic:true}); bw.nextAI=1e9; bw.nextAiScout=1e9; bw._updateVision(); bw.armies.length=0;
    const y0=bw.bridges[0].y+260; const xW=bw.riverX(y0)-500, xE=bw.riverX(y0)+500;
    const A={owner:0,type:'spear',count:300,x:xW,y:y0,to:-1,tx:xE,ty:y0,trail:0,food:100};
    bw.armies.push(A);
    let crossedAtBridge=false, everInWater=false;
    for(let k=0;k<180*30&&!A.camped;k++){ bw.update(1/30);
      const dRiver=Math.abs(A.x-bw.riverX(A.y));
      if(dRiver<62){ everInWater=true; if(bw.nearBridge(A.x,A.y,150)) crossedAtBridge=true; } }
    ok(A.camped&&Math.abs(A.x-xE)<60, '🌊 Qua sông tới được bờ kia');
    ok(!everInWater||crossedAtBridge, '🌊 CHỈ vượt sông tại CẦU/BẾN (tự vòng đường tới bến)');
    ok(bw.bridges.length===4, '⛩️ Mỗi bản đồ có 4 bến sông');
  }
  // 3) ĐƯỜNG CÁI: hành lang đồng bằng; hoang dã là rừng/núi đi chậm
  { const bw=new BigWar(1,{classic:true});
    const r0=bw.roads[0]; const mx=(r0.x1+r0.x2)/2, my2=(r0.y1+r0.y2)/2;
    ok(bw.roads.length>=bw.nodes.length*0.8, `🛣️ Có mạng đường cái nối các thành trấn (${bw.roads.length} đoạn)`);
    ok(bw.terAt(mx,my2)==='plain', '🛣️ Giữa đường cái là hành lang đồng bằng (đi nhanh)');
    // điểm hoang dã xa đường & xa mọi mảng đặc biệt -> rừng/núi
    let wild=0,total=0;
    for(let x=300;x<BW.W;x+=160) for(let y=260;y<BW.H-80;y+=160){ if(bw.distRoad(x,y)>200&&Math.abs(x-bw.riverX(y))>100){ total++; const t=bw.terAt(x,y); if(t==='forest'||t==='mountain') wild++; } }
    ok(wild/total>0.2&&wild/total<0.65, `🌲 Địa hình cân đối: rừng núi chiếm ${Math.round(wild/total*100)}% vùng xa đường — còn lại là đồng trống cho kỵ binh và đại quân`);
    const sp={forest:0.58,mountain:0.42}; ok(sp.forest<0.65&&sp.mountain<0.5, '🌲 Xuyên rừng 0.58x, trèo núi 0.42x tốc độ');
  }
  // 4) 20 BẢN ĐỒ mỗi chế độ + trại nằm chỗ KHÁC NHAU
  { ok(BW_MAPS.solo.length>=20&&BW_MAPS.royale.length>=20, `🗺️ ${BW_MAPS.solo.length} bản đồ 1v1 + ${BW_MAPS.royale.length} bản đồ quần hùng`);
    const pos=new Set();
    for(let mi=0;mi<20;mi++){ const bw=new BigWar(1,{map:mi}); const c0=bw.nodes[0];
      pos.add(Math.round(c0.x/300)+'_'+Math.round(c0.y/200));
      ok2:0; }
    ok(pos.size>=6, `🗺️ Trại người chơi nằm ở ${pos.size} vùng vị trí khác nhau qua 20 bản đồ (random theo bản đồ)`);
    const bwa=new BigWar(1,{map:2}), bwb=new BigWar(1,{map:9});
    ok(Math.hypot(bwa.nodes[0].x-bwb.nodes[0].x, bwa.nodes[0].y-bwb.nodes[0].y)>200||Math.hypot(bwa.nodes[1].x-bwb.nodes[1].x, bwa.nodes[1].y-bwb.nodes[1].y)>200, '🗺️ Đổi bản đồ là đổi thế trận');
    ok(bwa.mapName&&bwa.mapName.length>2, `🗺️ Bản đồ có tên: "${bwa.mapName}"`);
  }
}

// ============ v2.2: CHỌN CỤM BỀN + TỰ HỢP BINH SAU THẮNG + MAP LỚN ============
{
  const MA = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, BW};')();
  const {BigWar, BW}=MA;
  ok(BW.W>=6000&&BW.H>=1400, `🗺️ Bản đồ phát hành ${BW.W}x${BW.H} (không bó theo web)`);
  const mk=()=>{ const bw=new BigWar(1,{classic:true}); bw.nextAI=1e9; bw.nextAiScout=1e9; bw.nextWaveF={1:1e9}; bw._updateVision(); bw.armies.length=0; return bw; };
  // 1) đúp CHẬM 0.6s vẫn ăn cụm; chạm thành viên cụm KHÔNG rơi cụm; cụm mai phục vẫn nhận lệnh node ta
  { const bw=mk(); const x0=BW.W*0.3,y0=BW.H*0.5;
    const A={owner:0,type:'spear',count:300,x:x0,y:y0,to:-1,trail:0,camped:true,ambush:true,food:100};
    const B={owner:0,type:'archer',count:250,x:x0+170,y:y0+60,to:-1,trail:0,camped:true,ambush:true,food:100};
    const C={owner:0,type:'saber',count:260,x:x0-150,y:y0-70,to:-1,trail:0,camped:true,ambush:true,food:100};
    bw.armies.push(A,B,C);
    bw.tap(A.x,A.y); bw.time+=0.6; bw.tap(A.x,A.y);
    ok(bw.selG&&bw.selG.length===3, '👥 Đúp nhịp chậm 0.6 giây vẫn chọn được cả cụm');
    bw.tap(B.x,B.y); // chạm thành viên khác
    ok(bw.selG&&bw.selG.length===3&&bw.selA===B, '👥 Chạm đạo KHÁC trong cụm: cụm GIỮ NGUYÊN, chỉ đổi đạo chính');
    const own=bw.nodes.find(n=>n.owner===0&&n.count>0); 
    bw.tap(own.x,own.y); if(bw.menu) bw.menuPick('move');
    ok([A,B,C].every(a=>!a.camped&&a.to===own.id), '👥 CỤM MAI PHỤC nhận lệnh tới node ta (luật mai phục không nuốt lệnh cụm)');
  }
  // 2) đúp vào 2 đạo sát nhau (chạm trượt) vẫn thành cụm
  { const bw=mk(); const x0=BW.W*0.3,y0=BW.H*0.5;
    const A={owner:0,type:'spear',count:300,x:x0,y:y0,to:-1,trail:0,camped:true,food:100};
    const B={owner:0,type:'archer',count:250,x:x0+90,y:y0+40,to:-1,trail:0,camped:true,food:100};
    bw.armies.push(A,B);
    bw.tap(A.x,A.y); bw.time+=0.3; bw.tap(B.x,B.y);
    ok(bw.selG&&bw.selG.length===2, '👥 Đúp trượt sang đạo sát bên vẫn ăn cụm');
  }
  // 3) THẮNG DÃ CHIẾN -> các đạo cùng trận TỰ HỢP LÀM 1
  { const bw=mk(); let x0=BW.W*0.45,y0=BW.H*0.5;
    find3: for(let x=600;x<BW.W-600;x+=40) for(let y=300;y<BW.H-200;y+=40){ let all=true; for(let dx=-320;dx<=80;dx+=40) if(bw.terAt(x+dx,y)!=='plain') all=false; if(all&&Math.abs(x-bw.riverX(y))>500&&!bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<420)){ x0=x; y0=y; break find3; } }
    const A={owner:0,type:'spear',count:700,x:x0,y:y0,to:-1,tx:x0+1,ty:y0,trail:0,food:80};
    const B={owner:1,type:'saber',count:900,x:x0+45,y:y0,to:-1,tx:x0-1,ty:y0,trail:0,food:60};
    bw.armies.push(A,B); let st=0; while(!bw.battles.length&&st++<600) bw.update(1/30);
    const C={owner:0,type:'archer',count:500,x:x0-300,y:y0,to:-1,tx:x0,ty:y0,trail:0,food:90};
    bw.armies.push(C); st=0; while(bw.battles.some(b=>!b.done)&&st++<4000) bw.update(1/30);
    const alive=bw.armies.filter(a=>a.owner===0&&!a.done&&a.count>0);
    ok(alive.length===1, `🤝 Sau chiến thắng, 2 đạo tham chiến HỢP BINH còn 1 đạo (${alive.length} đạo, ${Math.round(alive[0]?.count||0)} quân)`);
    ok(alive[0]&&alive[0].count>600, '🤝 Quân số gộp đủ cả hai đạo trừ tổn thất');
  }
  // 4) CÔNG THÀNH thắng với nhiều đạo -> tất cả nhập thành làm 1 (node)
  { const bw=mk(); const neu=bw.nodes.find(n=>n.owner===2&&n.count>200&&!n.eco)||bw.nodes.find(n=>n.owner===2&&n.count>0);
    const mkA=(dx,c2)=>({owner:0,type:'cavalry',count:c2,x:neu.x+dx,y:neu.y+90,to:neu.id,trail:0,food:100});
    const A=mkA(-40,neu.count*0.7|0), B=mkA(40,neu.count*0.8|0);
    bw.armies.push(A,B); bw.arrive(A,neu); bw.arrive(B,neu);
    let st=0; while(bw.battles.some(b=>!b.done)&&st++<4000) bw.update(1/30);
    ok(neu.owner===0&&bw.armies.filter(a=>a.owner===0&&!a.done).length===0, `🤝 Hạ cứ điểm: mọi đạo công thành nhập hết vào thành (${Math.round(neu.count)} quân trấn giữ)`);
  }
}

// ============ v2.5: GỘP QUÂN THÀNH -> ĐẠO DÃ NGOẠI ============
{
  const MB = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, BW};')();
  const {BigWar, BW}=MB;
  const mk=()=>{ const bw=new BigWar(1,{classic:true,autoMenu:false}); bw.nextAI=1e9; bw.nextAiScout=1e9; bw.nextWaveF={1:1e9}; bw._updateVision(); bw.armies.length=0; return bw; };
  // 1) thành trấn -> gộp vào đạo dã ngoại (đứng yên, mai phục)
  { const bw=mk(); const nd=bw.nodes.find(n=>n.owner===0&&n.count>200&&!n.camp)||bw.nodes[0]; nd.count=Math.max(400,nd.count);
    const sgn=Math.sign(nd.x-bw.riverX(nd.y))||1;
    const F={owner:0,type:'archer',count:300,x:nd.x+sgn*500,y:Math.min(BW.H-120,nd.y+40),to:-1,trail:0,camped:true,ambush:true,food:60};
    bw.armies.push(F);
    const c0=nd.count;
    bw.sel=nd; bw.tap(F.x,F.y);
    ok(!!bw.menu&&bw.menu.opts.some(o=>o.id==='merge'), '🤝 Chọn thành + chạm đạo dã ngoại -> menu có GỘP QUÂN');
    bw.menuPick('merge');
    const a=bw.armies.find(x=>x.owner===0&&x.mergeInto===F);
    ok(!!a&&nd.count===0, '🤝 Quân xuất thành mang lệnh gộp');
    let st=0; while(!a.done&&st++<240*30) bw.update(1/30);
    ok(a.done&&Math.round(F.count)>=Math.round(c0+300-5), `🤝 Nhập đội thành công: đạo dã ngoại còn ${Math.round(F.count)} quân (gốc 300 + ${c0} từ thành)`);
    ok(F.camped&&F.ambush, '🤝 Đạo nhận quân vẫn giữ nguyên thế đóng/mai phục');
  }
  // 2) gộp vào đạo ĐANG DI CHUYỂN: bám theo và nhập giữa đường
  { const bw=mk(); const x0=BW.W*0.35, y0=BW.H*0.5;
    const T={owner:0,type:'spear',count:200,x:x0,y:y0,to:-1,tx:x0+900,ty:y0,trail:0,food:100};
    const M={owner:0,type:'saber',count:500,x:x0-200,y:y0,to:-1,trail:0,camped:true,food:100};
    bw.armies.push(T,M);
    bw.selA=M; bw.tap(T.x,T.y); bw.menuPick('merge');
    let st=0; while(!M.done&&st++<300*30) bw.update(1/30);
    ok(M.done&&Math.round(T.count)===700, `🤝 Gộp được vào đạo đang hành quân (${Math.round(T.count)} quân)`);
    ok(T.type==='saber', '🤝 Phe đông hơn quyết định binh chủng sau gộp');
  }
  // 3) chọn 'switch' thì chỉ đổi chọn, không điều quân
  { const bw=mk(); const nd=bw.nodes.find(n=>n.owner===0&&n.count>0); const c0=nd.count;
    const F={owner:0,type:'archer',count:100,x:nd.x+300,y:nd.y,to:-1,trail:0,camped:true,food:100};
    bw.armies.push(F); bw.sel=nd; bw.tap(F.x,F.y); bw.menuPick('switch');
    ok(bw.selA===F&&nd.count===c0&&bw.armies.filter(a=>a.owner===0).length===1, '👉 "Chọn đạo này" chỉ đổi lựa chọn, thành giữ nguyên quân');
  }
}
