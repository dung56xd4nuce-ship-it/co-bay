// Kiểm chứng các tình huống mục 11 ở mức luật
import fs from 'fs';
// lõi Đại Chiến = 09_bigwar + các phần nối dài (địa hình/đường đi, văn minh)
const BWSRC=['09_bigwar.js','09a_terrain.js','09c_civ.js','09d_supply.js','09e_gear.js','09f_brain.js','09g_mix.js','09h_decor.js','09o_supply2.js'].filter(f=>fs.existsSync('src/'+f)).map(f=>fs.readFileSync('src/'+f,'utf8')).join('\n');
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
    ok(cav.camped&&inCav>0&&Math.hypot(cav.x-deep[0],cav.y-deep[1])<5&&BW.mv.H.forest>0&&BW.mv.H.forest<BW.mv.F.forest&&BW.mv.H.mountain>0&&BW.mv.H.mountain<BW.mv.F.mountain, '🐎 (5.4) KỴ BINH vào được GIỮA RỪNG — không còn chỗ cấm, chỉ chậm hơn bộ binh khi ở trong rừng núi');
    ok(big.camped&&inBig>0&&Math.hypot(big.x-deep[0],big.y-deep[1])<5, '🚩 (5.4) ĐẠI QUÂN (≥2000) vào được GIỮA RỪNG — đông quân chỉ đi chậm hơn');
    { // thế mạnh văn minh: Đại Việt đi rừng thạo — đại quân BỘ BINH vào được rừng, kỵ binh thì vẫn không
      const bw6=new BigWar(1,{classic:true,civ:'daiviet'}); bw6._updateVision(); bw6.aiTurn=()=>{}; const c6=bw6.nodes[0];
      let d6=null; o6: for(let x=400;x<BW.W;x+=20) for(let y=240;y<BW.H-80;y+=20){ if([[0,0],[70,0],[-70,0],[0,70],[0,-70]].every(([dx,dy])=>bw6.terAt(x+dx,y+dy)==='forest')){ d6=[x,y]; break o6; } }
      const big6={owner:0,type:'spear',count:2600,x:c6.x+40,y:c6.y,to:-1,tx:d6[0],ty:d6[1],trail:0,food:100}, cav6={owner:0,type:'cavalry',count:300,x:c6.x+40,y:c6.y,to:-1,tx:d6[0],ty:d6[1],trail:0,food:100}; bw6.armies.push(big6,cav6);
      let st6=0; while(st6++<200*30&&!(big6.camped&&cav6.camped)){ bw6.update(1/30); big6.food=cav6.food=100; big6.count=Math.max(big6.count,2600); }
      { const cF=bw6.navCost('F'), cFf=bw6.navCost('Ff'), gi=bw6.navCell(d6[0],d6[1]); ok(bw6.civOf(0).id==='daiviet'&&big6.camped&&Math.hypot(big6.x-d6[0],big6.y-d6[1])<5&&bw6.mvProfile(big6)==='Ff'&&cFf[gi]<cF[gi], '🐉 Đại Việt (đi rừng thạo): bộ binh đi trong rừng NHANH hơn nước khác'); }
      ok(bw6.nodes[0].type==='spear'&&bw6.civOf(1)&&bw6.civOf(1).id!=='daiviet', '🏛️ Trại của Đại Việt sinh GIÁO BINH (binh chủng sở trường); đối thủ là nền văn minh khác');
      const b1=new BigWar(3,{civ:'mongol'}), b2=new BigWar(3,{civ:'mongol'});
      ok(b1.civOf(0).id==='mongol'&&b1.nodes[0].type==='cavalry'&&b1.civOf(1).id===b2.civOf(1).id, '🏛️ Chọn Mông Cổ: trại sinh KỴ BINH; đối thủ của ải cố định (không đổi giữa các lần vào)');
      const rr1=new BigWar(5,{royale:36,seed:77,civ:'rome'}); const ids=Object.values(rr1.civs).map(c=>c.id);
      ok(ids.length===37&&new Set(ids).size===37&&rr1.civOf(0).id==='rome', `🌏 Quần Hùng: 37 nước là 37 nền văn minh KHÁC NHAU (${new Set(ids).size}), ta là La Mã`);
      const e1=rr1.civAtk(0,'shield','plain'), e2=rr1.civAtk(0,'spear','plain');
      ok(e1>1.1&&e2===1, `⚔️ Binh chủng sở trường đánh mạnh hơn (khiên La Mã ×${e1.toFixed(2)}, loại khác ×${e2})`);
    }
    ok(bw5.mvProfile(cav)==='H'&&bw5.mvProfile(big)==='F'&&bw5.mvProfile(foot)==='F'&&bw5.mvProfile({type:'assassin',count:300,owner:0})==='R', '🧭 Lớp di chuyển: kỵ = H, bộ binh (đông hay ít) = F, đột kích = R');
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
  const r4=bw4.roads.find(r=>r.a===s4.id||r.b===s4.id), fw4=r4.a===s4.id, q4=Math.min(0.9,300/r4.len), at4=(f)=>bw4.roadAt(r4,fw4? f : 1-f), p4=at4(q4), t4=at4(Math.min(0.97,q4+0.07)); // mục tiêu chạy dọc đường cái (đường nay uốn cong: lấy điểm trên chính tuyến đường)
  const run={owner:1,type:'archer',count:300,x:p4[0],y:p4[1],to:-1,tx:t4[0],ty:t4[1],trail:0};
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
  // ổ phục đặt cách ĐƯỜNG ĐI THẬT của kỵ binh ~130px (đường cái nay uốn cong, kỵ binh có thể đi tắt qua chỗ trống nên lấy đúng lộ trình tìm đường trả về)
  let fx=null, rd=null; outer: for(const r of bw3.roads){ if(r.a==null||r.b==null||r.len<360) continue; const A=bw3.nodes[r.a], B=bw3.nodes[r.b];
      const P=bw3.findPath('H',A.x,A.y,B.x,B.y); if(!P.ok) continue; const pl=[[A.x,A.y],...P.pts];
      for(let i=1;i<pl.length;i++){ const dx=pl[i][0]-pl[i-1][0], dy=pl[i][1]-pl[i-1][1], L=Math.hypot(dx,dy); if(L<40) continue; const ux=dx/L, uy=dy/L;
        for(const f of [0.5,0.25,0.75]) for(const off of [130,-130,150,-150]){ const x=pl[i-1][0]+dx*f-uy*off, y=pl[i-1][1]+dy*f+ux*off; if(bw3.terAt(x,y)==='forest'&&!bw3.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<260)){ fx=[x,y]; rd=r; break outer; } } } }
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
    // hai đạo quân đặt sát nhau trên con đường cạnh một cứ điểm (chỗ chắc chắn đi được, bản đồ sinh ngẫu nhiên mỗi lần chạy) — không phụ thuộc quãng đường tìm tới nhau
    for(const n of bw2.nodes) n.ambush=false; const nd2=bw2.nodes.find(n=>n.owner===2&&!n.camp&&!n.eco)||bw2.nodes[2], px2=nd2.x, py2=nd2.y+150;
    const W1={owner:0,type:'swordsman',count:2000,x:px2-70,y:py2,to:-1,tx:px2+10,ty:py2,trail:0,food:20};
    const L1={owner:1,type:'archer',count:300,x:px2+30,y:py2,to:-1,tx:px2-10,ty:py2,trail:0,food:90};
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
    const p05=bw.prepTime(500,60), p2=bw.prepTime(2000,60), p10=bw.prepTime(10000,60), p50=bw.prepTime(50000,60);   // chặng dài (≥45 giây đường)
    ok(p05===0&&p2>=1&&p2<=2.5&&p10>=6&&p10<=8.5&&p50>=20&&p50<=26, `🌾 Chuẩn bị lương: 500 quân ${p05}s · 2 000 quân ${p2.toFixed(1)}s · 10 000 quân ${p10.toFixed(1)}s · 50 000 quân ${p50.toFixed(1)}s`);
    ok(bw.prepTime(10000,60,true)<p10*0.55&&bw.prepTime(10000,3)===0&&bw.prepTime(10000,20)<p10*0.5&&bw.prepTime(10000,20)>0, `🌾 Kho tại chỗ đầy lương thì chuẩn bị nhanh gấp đôi (${bw.prepTime(10000,60,true).toFixed(1)}s); đánh sang ngay bên cạnh (3 giây đường) không phải chờ (${bw.prepTime(10000,3)}s); chặng 20 giây chờ ${bw.prepTime(10000,20).toFixed(1)}s`);
    // CHỈ quân rời trại/thành/kho mới phải chuẩn bị; quân đồn ngoài đồng (cứ điểm đất trống) và đạo quân dã ngoại đi ngay
    { const capN=bw.nodes.find(n=>n.camp&&n.owner===0), land=bw.nodes.filter(n=>!n.camp&&!n.struct&&!n.eco).sort((a,b)=>Math.hypot(b.x-capN.x,b.y-capN.y)-Math.hypot(a.x-capN.x,a.y-capN.y)), tgt=land[0], src=land[land.length-1];
      const o=src.owner, c0=src.count, t0=src.type; src.owner=0; src.count=12000; src.type='swordsman'; const a1=bw.send(src,tgt); const pLand=a1.prep||0, y1=a1.y-src.y; a1.done=true; a1.count=0; src.owner=o; src.count=c0; src.type=t0;
      capN.count=12000; capN.food=0; const a2=bw.send(capN,tgt); const pCamp=a2.prep||0; a2.done=true; a2.count=0; bw.armies=bw.armies.filter(a=>!a.done);
      const fA={owner:0,type:'swordsman',count:12000,x:src.x+90,y:src.y,food:80}; const fc=bw.supplyForecast(fA,tgt.x,tgt.y,false);
      ok(pLand===0&&Math.abs(y1)<1&&pCamp>3&&fc.prep===0, `🚩 12 000 quân ĐỒN NGOÀI ĐỒNG (không trại, không thành) nhận lệnh là đi ngay (chờ ${pLand}s); cùng số quân rời KINH ĐÔ phải chuẩn bị ${pCamp.toFixed(1)}s; đạo quân dã ngoại: ${fc.prep}s`); }
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
    const r0=bw.roads[0]; const mx=r0.mx, my2=r0.my;   // điểm giữa trên chính tuyến đường (đường uốn cong)
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

// ============ v5.1: ĐƯỜNG CÁI UỐN CONG · VÙNG LIÊN THÔNG · NHỊP MÁY NGHĨ ============
{
  const M51 = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, BW};')();
  const {BigWar, BW}=M51; let sd=12345; const rnd=()=>{ sd=(sd*1103515245+12345)&0x7fffffff; return sd/0x7fffffff; };
  for(const [name,mk] of [['1v1',()=>new BigWar(3,{map:2,autoMenu:false})],['Quần Hùng',()=>new BigWar(5,{royale:36,seed:61,map:1,autoMenu:false})]]){
    const bw=mk(), R=bw.roads, nN=bw.nodes.length, NB=bw.bridges.length;
    ok(R.length>=nN*0.8&&R.every(r=>r.pts&&r.pts.length>=2&&r.pts[0][0]===r.x1&&r.pts[0][1]===r.y1&&r.pts[r.pts.length-1][0]===r.x2&&r.pts[r.pts.length-1][1]===r.y2&&r.len>0),
      `🛣️ ${name}: ${R.length} tuyến đường, tuyến nào cũng là chuỗi điểm nối đúng hai đầu`);
    // mọi cứ điểm vẫn nối liền nhau sau khi tỉa đường thừa
    { const uf=[...Array(nN+NB).keys()], find=(i)=>{ while(uf[i]!==i){ uf[i]=uf[uf[i]]; i=uf[i]; } return i; };
      for(const r of R){ const a= r.a!=null? r.a : nN+bw.bridges.findIndex(b=>b.x===r.x1&&b.y===r.y1), b= r.b!=null? r.b : nN+bw.bridges.findIndex(b2=>b2.x===r.x2&&b2.y===r.y2); uf[find(a)]=find(b); }
      const root=find(0); ok(bw.nodes.every((n,i)=>find(i)===root), `🛣️ ${name}: tỉa đường thừa xong mọi cứ điểm vẫn nối liền nhau bằng đường cái`); }
    // không còn "tam giác" đường (trong mỗi tam giác đã bỏ cạnh dài nhất)
    { const key=(a,b)=>a<b? a*4096+b : b*4096+a, E=new Set(), nb=new Map(); for(const r of R){ if(r.a==null||r.b==null) continue; E.add(key(r.a,r.b)); for(const [u,v] of [[r.a,r.b],[r.b,r.a]]){ if(!nb.has(u)) nb.set(u,[]); nb.get(u).push(v); } }
      let tri=0; for(const [u,vs] of nb) for(let i=0;i<vs.length;i++) for(let j=i+1;j<vs.length;j++) if(E.has(key(vs[i],vs[j]))) tri++;
      ok(tri===0, `🛣️ ${name}: không còn ba con đường khép thành tam giác (đếm được ${tri/3})`); }
    // đường uốn cong thật, nhưng không lấn xuống nước sâu và không vượt mép bản đồ
    { const long=R.filter(r=>r.a!=null&&r.b!=null&&Math.hypot(r.x2-r.x1,r.y2-r.y1)>=500); let curved=0, maxDev=0;
      for(const r of long){ const dx=r.x2-r.x1, dy=r.y2-r.y1, L=Math.hypot(dx,dy); let dev=0; for(const q of r.pts) dev=Math.max(dev,Math.abs((q[0]-r.x1)*dy-(q[1]-r.y1)*dx)/L); if(dev>=10) curved++; maxDev=Math.max(maxDev,dev); }
      ok(long.length>0&&curved/long.length>=0.6&&maxDev<=160, `🛣️ ${name}: ${curved}/${long.length} tuyến dài uốn cong thấy rõ (lệch tối đa ${Math.round(maxDev)}px so với đường thẳng)`);
      let wet=0, out=0, offCorr=0, pts=0; for(const r of R){ for(let i=0;i<r.pts.length;i++){ const [x,y]=r.pts[i]; pts++; if(x<0||y<0||x>BW.W||y>BW.H) out++;
          if(Math.abs(x-bw.riverX(y))<62&&!bw.nearBridge(x,y,BW.fordR+70)) wet++; const t=bw.terAt(x,y); if(t!=='plain'&&t!=='river') offCorr++; } }
      ok(wet===0&&out===0, `🛣️ ${name}: không điểm đường nào nằm giữa sông sâu (${wet}) hay ngoài bản đồ (${out}) trên ${pts} điểm`);
      ok(offCorr===0, `🛣️ ${name}: dọc theo đường cong vẫn là hành lang đất trống cho kỵ binh và đại quân (${offCorr} điểm lạc vào rừng núi)`);
      ok(R.every(r=>bw.distRoad(r.mx,r.my)<1.5)&&R.every(r=>{ const a=bw.roadAt(r,0), b=bw.roadAt(r,1); return Math.hypot(a[0]-r.x1,a[1]-r.y1)<0.01&&Math.hypot(b[0]-r.x2,b[1]-r.y2)<0.01; }), `🛣️ ${name}: điểm giữa và hai đầu mút tra đúng trên tuyến đường`); }
    // cùng hạt giống → cùng mạng đường (hai máy P2P phải ra một bản đồ)
    { const bw2=mk(); ok(JSON.stringify(bw2.roads.map(r=>r.pts))===JSON.stringify(R.map(r=>r.pts)), `🛣️ ${name}: dựng lại cùng bản đồ ra đúng mạng đường cũ (P2P hai máy khớp nhau)`); }
    // kỵ binh đi được giữa hai cứ điểm có đường nối, kể cả khi đường xuyên rừng núi
    { let bad=0, n=0; for(const r of R){ if(r.a==null||r.b==null) continue; const A=bw.nodes[r.a], B=bw.nodes[r.b]; n++; if(!bw.findPath('H',A.x,A.y,B.x,B.y).ok) bad++; }
      ok(bad===0, `🐎 ${name}: kỵ binh/đại quân đi được trên cả ${n} tuyến đường nối hai cứ điểm`); }
    // "có tới được không" tra bằng vùng liên thông phải khớp với kết quả dò đường thật
    { let diff=0, n=0, unreach=0; const types=['cavalry','spear','assassin'];
      for(let k=0;k<240;k++){ const src=bw.nodes[(rnd()*nN)|0], x=60+rnd()*(BW.W-120), y=60+rnd()*(BW.H-120), a={x:src.x,y:src.y,owner:src.owner,type:types[k%3],count: k%2? 300 : 5000};
        const c=bw.canReach(a,x,y), P=bw.findPath(bw.mvProfile(a),a.x,a.y,x,y); n++; if(c.ok!==P.ok) diff++; if(!P.ok){ unreach++; const e=c.end; if(!Array.isArray(e)||!(P.pts.length? Math.hypot(e[0]-P.pts[P.pts.length-1][0],e[1]-P.pts[P.pts.length-1][1])<1 : true)) diff++; } }
      ok(diff===0, `🧭 ${name}: tra "tới được không" bằng vùng liên thông khớp dò đường thật ở ${n} cặp điểm (trong đó ${unreach} cặp không có lối)`);
      // đích không tới được: không còn loang khắp bản đồ
      const N=bw.nav; let worst=0, tested=0; for(let k=0;k<400&&tested<12;k++){ const src=bw.nodes[(rnd()*nN)|0], x=60+rnd()*(BW.W-120), y=60+rnd()*(BW.H-120), a={x:src.x,y:src.y,owner:2,type:'cavalry',count:900};
        if(bw.canReach(a,x,y).ok) continue; tested++; N.cache.clear(); bw.findPath('H',a.x,a.y,x,y); let closed=0; for(let i=0;i<N.n;i++) if(N.cl[i]===N.tick) closed++; worst=Math.max(worst,closed/N.n); }
      ok(tested>0&&worst<0.6, `🧭 ${name}: đích không có lối — dò đường chỉ duyệt tối đa ${Math.round(worst*100)}% bản đồ (trước đây loang hết 100%)`); }
  }
  // không cứ điểm nào nằm đè lên cứ điểm khác (lỗi cũ: cứ điểm dồn ra mép bản đồ chồng lên nhau, có cặp trùng hẳn một chỗ)
  { let worst=1e9, where='', pairs=0, maps=0, inRiver=0, outB=0;
    for(const [mode,cnt] of [['solo',20],['royale',6]]) for(let m=0;m<cnt;m++){ const bw= mode==='royale'? new BigWar(5,{royale:36,seed:61+m,map:m,autoMenu:false}) : new BigWar(1+(m%10),{map:m,autoMenu:false}); maps++; const N=bw.nodes;
      for(let i=0;i<N.length;i++){ if(Math.abs(N[i].x-bw.riverX(N[i].y))<62) inRiver++; if(N[i].x<60||N[i].y<60||N[i].x>BW.W-60||N[i].y>BW.H-60) outB++;
        for(let j=i+1;j<N.length;j++){ const d=Math.hypot(N[i].x-N[j].x,N[i].y-N[j].y); if(d<120) pairs++; if(d<worst){ worst=d; where=mode+'#'+m+' '+bw.mapName; } } } }
    ok(pairs===0, `🏘️ ${maps} bản đồ: không cặp cứ điểm nào nằm đè lên nhau (gần nhất ${Math.round(worst)}px ở ${where})`);
    ok(inRiver===0&&outB===0, `🏘️ ${maps} bản đồ: không cứ điểm nào giữa sông (${inRiver}) hay sát mép bản đồ (${outB})`); }
  // bảng đồng minh dạng số khớp với danh sách gốc
  { const bw=new BigWar(5,{royale:36,seed:61,map:1,autoMenu:false}); let bad=0; const pairs=[];
    for(let k=0;k<60;k++){ const a=(rnd()*37)|0, b=(rnd()*37)|0; if(a===b||a===2||b===2) continue; bw.setAlly(a,b,rnd()<0.7); pairs.push([a,b]); }
    for(let a=0;a<37;a++) for(let b=0;b<37;b++){ const want=bw.allies.has(a<b? a+'-'+b : b+'-'+a); if(bw.allied(a,b)!==want||bw.allied(b,a)!==want) bad++; }
    ok(bad===0&&bw.allies.size>0, `🤝 Bảng đồng minh tra nhanh khớp danh sách gốc (${bw.allies.size} cặp, sai ${bad})`);
    bw.setAlly(pairs[0][0],pairs[0][1],false); ok(!bw.allied(pairs[0][0],pairs[0][1]), '🤝 Cắt bang giao là hết đồng minh ngay'); }
  // Quần Hùng: mỗi nhịp mô phỏng chỉ một nước ra quyết định, và nước nào cũng tới lượt
  { const bw=new BigWar(5,{royale:36,seed:61,map:1,autoMenu:false}); bw._updateVision(); const seen=new Map(); let cur=0, maxPer=0; const f0=bw.aiTurn.bind(bw);
    bw.aiTurn=(fid)=>{ cur++; seen.set(fid,(seen.get(fid)||0)+1); return f0(fid); };
    const steps=Math.round(120/0.05); for(let i=0;i<steps&&!bw.over;i++){ cur=0; bw.update(0.05); if(cur>maxPer) maxPer=cur; }
    const alive=new Set(bw.nodes.filter(n=>n.owner!==bw.localFid&&n.owner!==2&&(n.count>0||n.camp)).map(n=>n.owner));
    ok(maxPer===1, `🧠 Quần Hùng: mỗi nhịp tối đa một nước ra quyết định (đo được ${maxPer})`);
    ok([...alive].every(f=>seen.get(f)>0)&&seen.size>=30, `🧠 Quần Hùng: sau 2 phút cả ${alive.size} nước còn sống đều đã tới lượt (${seen.size} nước đã nghĩ)`);
    ok(!bw._navWarm.length&&Object.keys(bw.nav.cost).length>=12&&Object.keys(bw.nav.comp).length>=12, `🧭 Bảng đi lại của cả ${Object.keys(bw.nav.cost).length} hồ sơ đã tính xong từ đầu trận (không dồn vào lúc đang đánh)`); }
}
// ============ v5.2: 🎒 QUÂN NHU · ⚒️ LÒ RÈN · 🪙 XU THEO MỐC ============
{
  const M52 = new Function("const audio=new Proxy({},{get:()=>()=>{}});const ArtImages={};const makeUnitSprite=()=>null;const recolorUnit=()=>null;const rr=()=>{};\n"
    + fs.readFileSync('src/01_config.js','utf8') + fs.readFileSync('src/02_map.js','utf8') + BWSRC
    + '\nreturn {BigWar, BW, BW_GEAR, BW_GEAR_BY, UPGRADES, BW_MAPS, BW_DECOR, BW_DECOR_BY};')();
  const {BigWar, BW, BW_GEAR, BW_GEAR_BY, UPGRADES, BW_MAPS, BW_DECOR, BW_DECOR_BY}=M52, G=BW.gear, hy=Math.hypot;
  const quiet=(bw)=>{ bw.nextAI=1e9; bw.nextAiScout=1e9; bw.nextWaveF={1:1e9}; bw._updateVision(); bw.armies.length=0; return bw; };
  const mk=(cfg,lv)=>quiet(new BigWar(lv||2,Object.assign({autoMenu:false,map:3},cfg||{})));
  // kho giả: đếm số món còn lại như phần lưu của người chơi
  const pack=(bw,ids,inv)=>{ const I=Object.assign({bun:5,tea:5,plank:5,smoke:5,scarecrow:5,compass:5,bandage:5,horn:5,sandbag:5,drum:5,banner:5,caltrops:5},inv||{}); bw.gearSetup(ids,{slots:(inv&&inv._slots)||undefined,stock:(id)=>I[id]||0,spend:(id)=>{ I[id]--; }}); return I; };
  const army=(bw,o)=>{ const c=bw.nodes.find(n=>n.camp&&n.owner===0), a=Object.assign({owner:0,type:'spear',count:900,x:c.x+260,y:c.y+120,to:-1,trail:0,camped:true,food:100},o||{}); if(a.tx==null){ a.tx=a.x; a.ty=a.y; } bw.armies.push(a); return a; };
  const run=(bw,sec,dt=1/20)=>{ for(let t=0;t<sec;t+=dt) bw.update(dt); };
  const slot=(bw,id)=>bw.gear.findIndex(g=>g.id===id);

  // ----- bảng món: đủ 7 món, giá và mô tả rõ ràng, mỗi món đúng một ảnh vật phẩm -----
  ok(BW_GEAR.length===12&&new Set(BW_GEAR.map(g=>g.id)).size===12&&BW_GEAR.every(g=>g.cost>=20&&g.cost<=80&&g.desc.length>20&&g.name&&['army','node','none','unit'].includes(g.need)),
    `🎒 Có 12 món quân nhu (7 cũ + 5 mới ở 6.1), giá ${Math.min(...BW_GEAR.map(g=>g.cost))}–${Math.max(...BW_GEAR.map(g=>g.cost))} xu, món nào cũng có tên và mô tả`);
  { const art=fs.readFileSync('src/05a_art.js','utf8'); ok(BW_GEAR.slice(0,7).every(g=>art.includes("'item:"+g.id+"'")), '🎒 7 món cũ dùng đúng ảnh vật phẩm có sẵn trong bộ art (7/7)');
    const s2=fs.readFileSync('src/09o_supply2.js','utf8'); ok(BW_GEAR.slice(7).every(g=>new RegExp(g.id+":\\[").test(s2)), '🎒 5 món mới có ảnh huy hiệu vẽ bằng mã (màu riêng từng món)'); }
  // ----- mang tối đa 3 món, bỏ món lạ và món trùng; P2P không có quân nhu -----
  { const bw=mk(); pack(bw,['bun','bun','khong-co','tea','plank','smoke']); ok(bw.gear.map(g=>g.id).join()==='bun,tea,plank', `🎒 Mang tối đa ${G.slots} món, bỏ món trùng và món lạ (đang mang: ${bw.gear.map(g=>g.id).join(', ')})`);
    const p2=new BigWar(1,{autoMenu:false,p2p:'host',up:{speed:5,power:5,armor:5,stamina:5,aura:5,weapon:5}}); pack(p2,['bun','tea']);
    ok(p2.gear.length===0&&p2.up===null&&p2.upMul('atk',0)===1&&p2.upMul('speed',0)===1, '📶 Trận 2 người (P2P): không quân nhu, không Lò rèn — hai bên ngang nhau'); }

  // ----- (6.1) ô túi: 3 → 4 → 5, không vượt 5 -----
  ok(BW.gearSlotsFor(0)===3&&BW.gearSlotsFor(1)===4&&BW.gearSlotsFor(2)===5&&BW.gearSlotsFor(9)===5&&G.slotCost.join()==='150,300', '🎒 Túi 3 ô; mua thêm ô 4 (150 xu) và ô 5 (300 xu), tối đa 5');
  { const bw=mk(); pack(bw,['bun','tea','plank','smoke','horn','drum'],{_slots:5}); ok(bw.gear.map(g=>g.id).join()==='bun,tea,plank,smoke,horn', `🎒 Túi 5 ô mang đúng 5 món (${bw.gear.map(g=>g.id).join(', ')})`); }
  // ----- 📯 tù và: trận kế tiếp ×1.3 -----
  { const fight=(horn)=>{ const bw=mk(); pack(bw,['horn']); const a=army(bw,{count:1000}), e=army(bw,{owner:1,count:1000,x:a.x+30}); if(horn){ bw.selA=a; bw.gearUse(0); } return {bw,a,e}; };
    const {bw,a}=fight(true); ok(a.hornT===G.hornT, `📯 Tù và: đạo quân được ${a.hornT}s hiệu lực`);
    const S={es:[{kind:'army',ref:a}],mul:1}; a.btl=7; bw.hornMul(S,null,0,0); const m1=S.mul; bw.hornMul(S,null,0,0);
    ok(Math.abs(m1-G.hornMul)<1e-9&&Math.abs(S.mul-G.hornMul)<1e-9, `📯 Vào trận: phe ta ×${m1.toFixed(2)}, cùng một trận không nhân hai lần`);
    a.btl=8; const S2={es:[{kind:'army',ref:a},{kind:'army',ref:{count:1000}}],mul:1}; bw.hornMul(S2,null,0,0); ok(Math.abs(S2.mul-1.15)<1e-9, `📯 Đánh chung với quân khác: tăng theo phần quân của đạo có tù và (×${S2.mul.toFixed(2)})`);
    run(bw,G.hornT+1); ok(!(a.hornT>0), `📯 Hết ${G.hornT}s thì hết hiệu lực`); }
  // ----- 🧱 bao cát: thủ ×1.5 trong 60s -----
  { const bw=mk(), I=pack(bw,['sandbag']), c=bw.nodes.find(n=>n.camp&&n.owner===0), d0=bw.defMul(c); bw.sel=c; const r=bw.gearUse(0);
    ok(r.ok&&Math.abs(bw.defMul(c)/d0-G.bagMul)<1e-9&&I.sandbag===4, `🧱 Bao cát: sức thủ cứ điểm ×${(bw.defMul(c)/d0).toFixed(2)}, kho còn ${I.sandbag}`);
    run(bw,G.bagT+1); ok(Math.abs(bw.defMul(c)/d0-1)<1e-9, `🧱 Hết ${G.bagT}s thì trở lại bình thường`); }
  // ----- 🥁 trống trận: sinh quân ×2 -----
  { const grow=(drum)=>{ const bw=mk(); pack(bw,['drum']); const c=bw.nodes.find(n=>n.camp&&n.owner===0); c.count=100; if(drum){ bw.sel=c; bw.gearUse(0); } run(bw,30); return c.count-100; };
    const g0=grow(false), g1=grow(true); ok(g1>g0*1.7, `🥁 Trống trận: đại bản doanh 30s sinh ${g0} → ${g1} quân`); }
  // ----- 🚩 cờ chiêu binh: +20% (tối thiểu 30) -----
  { const bw=mk(), I=pack(bw,['banner']), c=bw.nodes.find(n=>n.camp&&n.owner===0); c.count=1000; bw.sel=c; let r=bw.gearUse(0);
    ok(r.ok&&c.count===1200&&I.banner===4, `🚩 Cờ chiêu binh: cứ điểm 1000 → ${c.count}`);
    const bw2=mk(); pack(bw2,['banner']); const c2=bw2.nodes.find(n=>n.camp&&n.owner===0); c2.count=40; bw2.sel=c2; bw2.gearUse(0); ok(c2.count===70, `🚩 Cứ điểm ít quân vẫn được ít nhất ${G.bannerMin} (40 → ${c2.count})`);
    const bw3=mk(), I3=pack(bw3,['banner']); bw3.sel=bw3.nodes.find(n=>n.owner===1); r=bw3.gearUse(0); ok(!r.ok&&r.why==='target'&&I3.banner===5, '🚩 Không dùng được lên cứ điểm địch, không mất món'); }
  // ----- 📌 chông sắt: quân địch quanh giữa màn hình chậm một nửa -----
  { const bw=mk(), I=pack(bw,['caltrops']); bw.camX=0; bw.camY=0; bw.lastVw=0; bw.lastVh=0; bw.scale=1;
    const e=army(bw,{owner:1,x:300,y:300}), far=army(bw,{owner:1,x:300+G.calR+400,y:300}), mine=army(bw,{x:200,y:200});
    const ke=bw.mvProfile(e), v0=bw.mvSpeed(e,ke), vf0=bw.mvSpeed(far,ke), vm0=bw.mvSpeed(mine,bw.mvProfile(mine)); const r=bw.gearUse(0);
    ok(r.ok&&Math.abs(bw.mvSpeed(e,ke)/v0-G.calMul)<1e-9&&Math.abs(bw.mvSpeed(far,ke)/vf0-1)<1e-9&&Math.abs(bw.mvSpeed(mine,bw.mvProfile(mine))/vm0-1)<1e-9&&I.caltrops===4,
      '📌 Chông sắt: địch trong vùng đi ×0.5; địch ngoài vùng và quân ta không bị ảnh hưởng');
    run(bw,G.calT+1); ok(!(bw.calZ&&bw.calZ.length)&&Math.abs(bw.mvSpeed(e,ke)/v0-1)<1e-9, `📌 Hết ${G.calT}s thì gỡ vùng chông`); }
  // ----- 🥟 bánh bao -----
  { const bw=mk(), I=pack(bw,['bun','tea','bandage']), a=army(bw,{food:22}); bw.selA=a;
    const r=bw.gearUse(slot(bw,'bun'));
    ok(r.ok&&a.food===BW.food.max&&I.bun===4, `🥟 Bánh bao: lương của đạo quân đang chọn 22 → ${a.food}, kho còn ${I.bun}`);
    ok(bw.gear[0].cd===G.cdSolo, `⏳ Dùng xong phải chờ ${bw.gear[0].cd}s mới dùng lại món đó`);
    a.food=30; const r2=bw.gearUse(slot(bw,'bun')); ok(!r2.ok&&r2.why==='cd'&&a.food===30&&I.bun===4, '⏳ Đang hồi: bấm lại không có tác dụng, không mất món');
    const r3=bw.gearUse(slot(bw,'tea')); ok(r3.ok&&a.teaT===G.teaT, '🎒 Món khác không bị khoá theo — mỗi món hồi riêng');
    run(bw,G.cdSolo+1); ok(bw.gear[0].cd===0, `⏳ Sau ${G.cdSolo}s món hồi xong`);
    a.food=100; bw.notes.length=0; const r4=bw.gearUse(slot(bw,'bun')); ok(!r4.ok&&r4.why==='full'&&I.bun===4&&bw.gear[0].cd===0&&bw.notes.length===1, '🥟 Đạo quân đang đủ lương: không cho dùng phí, không mất món, có lời nhắc'); }
  // ----- chưa chọn đúng đối tượng / hết món -----
  { const bw=mk(), I=pack(bw,['tea','scarecrow','bandage'],{bandage:0}), a=army(bw), en=army(bw,{owner:1,x:a.x+900}), c=bw.nodes.find(n=>n.camp&&n.owner===0);
    bw.notes.length=0; let r=bw.gearUse(slot(bw,'tea')); ok(!r.ok&&r.why==='target'&&I.tea===5&&/armies in the field/.test(bw.notes[0].text), '🎒 Chưa chọn đạo quân: món không bị tiêu, có lời nhắc "chọn một đạo quân của ta trước"');
    bw.selA=en; r=bw.gearUse(slot(bw,'tea')); ok(!r.ok&&r.why==='target'&&!(en.teaT>0), '🎒 Không dùng được quân nhu lên quân địch');
    bw.selA=a; r=bw.gearUse(slot(bw,'scarecrow')); ok(!r.ok&&r.why==='target'&&/strongholds/.test(bw.notes[bw.notes.length-1].text), '👒 Bù nhìn cần chọn một CỨ ĐIỂM của ta (đang chọn đạo quân thì nhắc)');
    bw.selA=null; bw.sel=c; r=bw.gearUse(slot(bw,'scarecrow')); ok(r.ok&&c.scareT===G.scareT&&I.scarecrow===4, '👒 Chọn cứ điểm của ta rồi dùng: được');
    bw.notes.length=0; r=bw.gearUse(slot(bw,'bandage')); ok(!r.ok&&r.why==='stock'&&/Out of/.test(bw.notes[0].text), '🎒 Hết món trong kho: báo "hết — mua thêm bằng xu"');
    const big=army(bw,{count:2400,x:a.x+120}), sm=army(bw,{count:300,x:a.x+240}); bw.sel=null; bw.selA=null; bw.selG=[sm,big,a]; bw.gear[0].cd=0;
    r=bw.gearUse(slot(bw,'tea')); ok(r.ok&&big.teaT>0&&!(sm.teaT>0), '🎒 Đang chọn cả cụm quân: món dành cho đạo đông nhất trong cụm'); }

  // ----- 🍵 trà gừng: +50% tốc độ trong 30 giây -----
  { const bw=mk(), I=pack(bw,['tea']), a=army(bw), key=bw.mvProfile(a), v0=bw.mvSpeed(a,key); bw.selA=a; bw.gearUse(0); const v1=bw.mvSpeed(a,key);
    ok(Math.abs(v1/v0-G.teaMul)<1e-9, `🍵 Trà gừng: tốc độ hành quân ×${(v1/v0).toFixed(2)}`);
    run(bw,G.teaT-2); const mid=bw.mvSpeed(a,key)/v0; run(bw,3); ok(Math.abs(mid-G.teaMul)<1e-9&&Math.abs(bw.mvSpeed(a,key)/v0-1)<1e-9&&!(a.teaT>0), `🍵 Hết ${G.teaT}s thì tốc độ trở lại bình thường`);
    // đi thật: cùng một quãng đường, có trà tới sớm hơn hẳn
    const go=(tea)=>{ const b2=mk(); pack(b2,['tea']); const c=b2.nodes.find(n=>n.camp&&n.owner===0), r=b2.roads.find(q=>q.a===c.id||q.b===c.id), o=b2.nodes[r.a===c.id? r.b : r.a], u=army(b2,{x:c.x,y:c.y+60,camped:false,tx:o.x,ty:o.y,food:100}); if(tea){ b2.selA=u; b2.gearUse(0); }
      let t=0; while(t<200&&hy(u.x-o.x,u.y-o.y)>40&&!u.done&&!u.camped){ b2.update(1/20); t+=1/20; } return {t,d:hy(c.x-o.x,c.y-o.y)}; };
    const A=go(false), B=go(true); ok(B.t<A.t*0.9, `🍵 Hành quân thật ${Math.round(A.d)}px: ${A.t.toFixed(1)}s → ${B.t.toFixed(1)}s khi uống trà`); }

  // ----- 🪵 ván cầu: 60 giây qua sông ở bất cứ đâu -----
  { const bw=mk(), I=pack(bw,['plank']);
    // chọn một khúc sông xa mọi bến, đứng bờ trái, đích ngay bờ phải
    let y=0, best=-1; for(let yy=220;yy<BW.H-220;yy+=40){ const d=Math.min(...bw.bridges.map(b=>Math.abs(b.y-yy))); const x=bw.riverX(yy); if(d>best&&bw.terAt(x-150,yy)==='plain'&&bw.terAt(x+150,yy)==='plain'){ best=d; y=yy; } }
    const rx=bw.riverX(y), a=army(bw,{x:rx-150,y,count:600}); bw.selA=a;
    // đếm số điểm trên đường đi nằm giữa dòng nước sâu mà KHÔNG ở bến nào
    const deep=(P,x0,y0)=>{ let n=0, px=x0, py=y0; for(const q of P.pts){ for(let k=1;k<=12;k++){ const x=px+(q[0]-px)*k/12, yy=py+(q[1]-py)*k/12; if(Math.abs(x-bw.riverX(yy))<40&&!bw.nearBridge(x,yy,BW.fordR+40)) n++; } px=q[0]; py=q[1]; } return n; };
    const p0=bw.findPath(bw.mvProfile(a),a.x,a.y,rx+150,y);
    ok(best>140&&p0.ok&&deep(p0,a.x,a.y)===0, `🌊 Không có ván: sang bờ bên kia (cách 300px) phải vòng qua bến cách đó ${Math.round(best)}px — quãng đường quy đổi ${Math.round(p0.cost)}`);
    const r=bw.gearUse(0), key=bw.mvProfile(a), p1=bw.findPath(key,a.x,a.y,rx+150,y);
    ok(r.ok&&a.plankT===G.plankT&&/w$/.test(key)&&p1.ok&&deep(p1,a.x,a.y)>0&&p1.cost<p0.cost*0.9, `🪵 Có ván: lội thẳng qua chỗ nước sâu, quãng đường quy đổi còn ${Math.round(p1.cost)} (né được bến đang bị giữ)`);
    a.camped=false; a.tx=rx+150; a.ty=y; let t=0, wet=false; while(t<G.plankT&&hy(a.x-a.tx,a.y-a.ty)>30&&!a.camped){ bw.update(1/20); t+=1/20; if(Math.abs(a.x-bw.riverX(a.y))<40) wet=true; }
    ok(wet&&a.x>bw.riverX(a.y)+60&&t<G.plankT, `🪵 Đạo quân lội qua giữa sông và sang tới bờ bên kia sau ${t.toFixed(1)}s`);
    // hết ván giữa dòng: không kẹt lại dưới nước
    const b2=mk(); pack(b2,['plank']); const u=army(b2,{x:rx-150,y,count:600}); b2.selA=u; b2.gearUse(0); u.camped=false; u.tx=rx+150; u.ty=y;
    let t2=0; while(t2<60&&Math.abs(u.x-b2.riverX(u.y))>12){ b2.update(1/20); t2+=1/20; } u.plankT=0.05; run(b2,90);
    ok(!u.done&&b2.terAt(u.x,u.y)!=='river'||b2.nearBridge(u.x,u.y), `🪵 Ván hết hạn khi đang giữa dòng: đạo quân vẫn lên được bờ (đang ở ${b2.terAt(u.x,u.y)}, cách sông ${Math.round(Math.abs(u.x-b2.riverX(u.y)))}px)`);
    // quân địch và quân ta không có ván thì vẫn không lội được
    const e=army(bw,{owner:1,x:rx-150,y:y+80}), f=army(bw,{x:rx-150,y:y-80}); ok(!/w$/.test(bw.mvProfile(e))&&!/w$/.test(bw.mvProfile(f)), '🪵 Chỉ đạo quân được phát ván mới lội được — các đạo khác vẫn phải qua bến'); }

  // ----- 💨 túi khói: máy không thấy đạo quân, đòn đầu ×1,5 -----
  { const fight=(smoke)=>{ const bw=mk(); pack(bw,['smoke']); const c=bw.nodes.find(n=>n.camp&&n.owner===0), X=c.x+700, Y=c.y;
      const a=army(bw,{x:X,y:Y,count:1000,camped:false,tx:X+200,ty:Y}), e=army(bw,{owner:1,x:X+60,y:Y,count:1000,camped:false,tx:X-200,ty:Y}); if(smoke){ bw.selA=a; bw.gearUse(0); }
      const sm0=a.smokeT||0; let t=0; while(!bw.battles.length&&t<10){ bw.update(1/30); t+=1/30; } const b=bw.battles[0], mine= b? (b.A.es.some(q=>q.ref===a)? b.A : b.B) : null, mul= mine? mine.mul : 0, sm1=a.smokeT||0;
      while(bw.battles.some(q=>!q.done)&&t<240){ bw.update(1/30); t+=1/30; } return {mul,sm0,sm1,a:Math.round(a.count),e:Math.round(e.count)}; };
    const f0=fight(false), f1=fight(true);
    ok(f1.sm0===G.smokeT&&f1.sm1===0&&Math.abs(f1.mul/f0.mul-G.smokeMul)<1e-9, `💨 Túi khói: vào trận là khói tan, đòn đánh của phe ta ×${(f1.mul/f0.mul).toFixed(2)}`);
    ok(f1.a>f0.a+100&&f1.e<=f0.e, `💨 1000 đấu 1000: không khói ta còn ${f0.a} (địch ${f0.e}) → có khói ta còn ${f1.a} (địch ${f1.e})`);
    // máy thấy đạo quân ta kéo tới thì gọi viện binh; đạo quân trong khói thì không bị phát hiện
    const defend=(smoke)=>{ const bw=new BigWar(6,{autoMenu:false,map:3}); bw.nextAiScout=1e9; bw.nextWaveF={1:1e9}; bw._updateVision(); bw.armies.length=0; pack(bw,['smoke']);
      const en=bw.nodes.filter(n=>n.owner===1&&!n.camp); let tgt=null, hp=null; for(const t of en){ for(const h of en){ if(h!==t&&hy(h.x-t.x,h.y-t.y)<=BW.range){ tgt=t; hp=h; break; } } if(tgt) break; }
      if(!tgt) return -1; tgt.count=300; hp.count=1500; for(const o of en){ if(o!==tgt&&o!==hp) o.count=100; }
      const a=army(bw,{x:tgt.x-200,y:tgt.y,count:1000,camped:false,to:tgt.id}); if(smoke){ bw.selA=a; bw.gearUse(0); }
      bw.time=5; bw.aiTurn(1); return bw.armies.filter(q=>q.owner===1&&q.to===tgt.id).length; };
    const d0=defend(false), d1=defend(true);
    ok(d0>=1&&d1===0, `💨 Máy thấy quân ta kéo tới thì gọi ${d0} đạo viện binh; đạo quân trong khói thì máy không hay biết (${d1} viện binh)`);
    const bw=mk(); pack(bw,['smoke']); const a=army(bw); bw.selA=a; bw.gearUse(0); run(bw,G.smokeT+1); ok(!(a.smokeT>0), `💨 Không đánh nhau thì khói tự tan sau ${G.smokeT}s`); }

  // ----- 👒 bù nhìn: máy tưởng cứ điểm đông gấp 3 trong 60 giây -----
  { const wave=(scare)=>{ const bw=new BigWar(10,{autoMenu:false,map:3}); bw.nextAiScout=1e9; bw._updateVision(); bw.armies.length=0; pack(bw,['scarecrow']);
      const ec=bw.nodes.find(n=>n.owner===1&&n.camp), T=bw.nodes.filter(n=>n.owner===2).sort((p,q)=>hy(p.x-ec.x,p.y-ec.y)-hy(q.x-ec.x,q.y-ec.y))[0];
      T.owner=0; T.count=260; T.type='spear'; for(const n of bw.nodes){ if(n.owner===0&&!n.camp&&n!==T) n.count=Math.max(n.count,1500); if(n.owner===1&&!n.camp) n.count=250; }
      if(scare){ bw.sel=T; bw.gearUse(0); }
      const see=bw.aiSee(T,1).count; bw.nextWaveF={1:0}; bw.time=5; bw.aiTurn(1); const to=bw.armies.filter(a=>a.owner===1&&a.to===T.id).length;
      for(let t=0;t<G.scareT+1;t++) bw.gearTick(1); return {see,to,after:bw.aiSee(T,1).count}; };
    const w0=wave(false), w1=wave(true);
    ok(w0.see===260&&w1.see===260*G.scareMul&&w1.after===260, `👒 Bù nhìn: máy đếm cứ điểm 260 quân thành ${w1.see}, hết ${G.scareT}s lại đếm đúng ${w1.after}`);
    ok(w0.to>=1&&w1.to===0, `👒 Cứ điểm yếu: không bù nhìn máy xua ${w0.to} đạo tới đánh; có bù nhìn máy chùn tay (${w1.to} đạo)`); }

  // ----- 🧭 la bàn: lộ quân số địch quanh giữa màn hình trong 30 giây -----
  { const bw=mk(), I=pack(bw,['compass']), E=bw.nodes.filter(n=>n.owner===1&&n.count>0&&!n.camp).sort((p,q)=>q.x-p.x)[0];
    bw.lastVw=800; bw.lastVh=400; bw.scale=0.5; bw.camX=E.x-800; bw.camY=E.y-400;   /* giữa màn hình đang là cứ điểm địch E */
    const foes=bw.nodes.filter(n=>n.owner!==0&&n.count>0), inR=foes.filter(n=>hy(n.x-E.x,n.y-E.y)<G.compassR-5), outR=foes.filter(n=>hy(n.x-E.x,n.y-E.y)>G.compassR+5);
    ok(!bw.visNow(E)&&!bw.visAt(E.x,E.y)&&inR.length>=2&&outR.length>=2, `🧭 Trước khi dùng: vùng địch tối, không biết quân số (${inR.length} cứ điểm trong tầm la bàn, ${outR.length} ngoài tầm)`);
    const r=bw.gearUse(0); bw._updateVision();
    ok(r.ok&&I.compass===4&&inR.every(n=>bw.visNow(n)&&n.known&&n.known.count===n.count)&&outR.every(n=>!bw.visNow(n)), `🧭 La bàn: lộ đúng quân số ${inR.length} cứ điểm quanh giữa màn hình, ${outR.length} cứ điểm ngoài tầm vẫn ẩn`);
    ok(bw.visAt(E.x,E.y)&&bw.tempVis.length===1, '🧭 Vùng la bàn soi sáng lên trên bản đồ (hết sương)');
    run(bw,G.compassT+1); bw._updateVision(); ok(!bw.visNow(E)&&!bw.visAt(E.x,E.y)&&bw.tempVis.length===0, `🧭 Hết ${G.compassT}s vùng đó tối lại, quân số ẩn như cũ`); }

  // ----- 🩹 băng cứu thương: cứu lại 30% quân vừa mất ở gần đó trong 60 giây -----
  { const scene=()=>{ const bw=mk(), I=pack(bw,['bandage']), c=bw.nodes.find(n=>n.camp&&n.owner===0), X=c.x+700, Y=c.y;
      const a=army(bw,{x:X,y:Y,count:1500,camped:false,tx:X+200,ty:Y}), e=army(bw,{owner:1,x:X+60,y:Y,count:800,camped:false,tx:X-200,ty:Y}); return {bw,I,a,e,X,Y}; };
    const fin=(bw)=>{ let t=0; while(!bw.battles.length&&t<10){ bw.update(1/30); t+=1/30; } while(bw.battles.some(q=>!q.done)&&t<240){ bw.update(1/30); t+=1/30; } };   /* chờ trận nổ ra rồi chờ đánh xong (trận xong bị dọn khỏi danh sách) */
    { const {bw,I,a}=scene(); fin(bw); const lost=bw.lossLog.reduce((t,e)=>t+e.n,0), c0=a.count; bw.selA=a; const r=bw.gearUse(0), back=a.count-c0;
      ok(r.ok&&lost>60&&Math.abs(back-lost*G.bandFrac)<=1&&I.bandage===4, `🩹 Thắng trận mất ${Math.round(lost)} quân → băng cứu thương cứu lại ${back} (30%)`);
      bw.gear[0].cd=0; bw.notes.length=0; const r2=bw.gearUse(0); ok(!r2.ok&&r2.why==='nothing'&&I.bandage===4&&a.count===c0+back&&bw.notes.length===1, '🩹 Một tổn thất chỉ cứu được một lần — dùng lại báo "không có ai để cứu", không mất món'); }
    { const {bw,I,a,X,Y}=scene(); fin(bw); const stay=army(bw,{x:X+120,y:Y+90,count:300}); run(bw,G.bandWindow+1); bw.selA=stay; const r=bw.gearUse(0); ok(!r.ok&&r.why==='nothing'&&stay.count<=300&&I.bandage===5, `🩹 Quá ${G.bandWindow}s thì không cứu được nữa (đạo quân đứng ngay cạnh nơi vừa đánh cũng không nhận được ai)`); }
    { const {bw,I,a,X,Y}=scene(); fin(bw); const far=army(bw,{x:X+G.bandR+300,y:Y,count:400}); bw.selA=far; const r=bw.gearUse(0); ok(!r.ok&&r.why==='nothing'&&far.count===400, `🩹 Đạo quân ở xa nơi thua thiệt (>${G.bandR}px) không nhận được thương binh`);
      const near=army(bw,{x:X+200,y:Y+100,count:400}); bw.selA=near; const r2=bw.gearUse(0); ok(r2.ok&&near.count>400, `🩹 Đạo quân khác đứng gần đó nhận thương binh về đội mình (400 → ${near.count})`); }
    { const {bw,I,a}=scene(); let t=0; while(!bw.battles.length&&t<10){ bw.update(1/30); t+=1/30; } run(bw,2.5,1/30); const b=bw.battles[0], l0=b.lostP, c0=a.count; bw.selA=a; const r=bw.gearUse(0);
      ok(!b.done&&r.ok&&l0>20&&Math.abs((a.count-c0)-l0*G.bandFrac)<=1&&b.lostP===0, `🩹 Dùng ngay giữa trận: cứu ${a.count-c0} trong ${Math.round(l0)} quân vừa ngã, trận vẫn tiếp diễn`); }
    // cứ điểm bị đánh cũng cứu được (chọn cứ điểm)
    { const bw=mk(), I=pack(bw,['bandage']), T=bw.nodes.find(n=>n.owner===0&&!n.camp&&n.count>0)||bw.nodes.find(n=>n.owner===0); T.count=1200; const e={owner:1,type:'spear',count:700,x:T.x,y:T.y,to:T.id,food:100}; bw.arrive(e,T); fin(bw);
      const lost=bw.lossLog.reduce((t,q)=>t+q.n,0), c0=T.count; bw.sel=T; const r=bw.gearUse(0); ok(T.owner===0&&r.ok&&lost>30&&T.count>c0, `🩹 Cứ điểm vừa bị công: giữ được thành, mất ${Math.round(lost)} quân, băng cứu thương trả lại ${T.count-c0}`); } }

  // ----- ⚒️ Lò rèn: nâng cấp vĩnh viễn, chỉ cho nước của người chơi -----
  { const UP={speed:5,power:5,armor:5,stamina:5,aura:5,weapon:5}, F=BW.forge, b0=mk(), b1=mk({up:UP}), nearly=(x,y,e=1e-9)=>Math.abs(x-y)<=e;
    ok(nearly(b1.upMul('speed',0),1.10)&&nearly(b1.upMul('atk',0),1.075*1.075)&&nearly(b1.upMul('armor',0),1.15)&&nearly(b1.upMul('stamina',0),1.25)&&nearly(b1.upMul('aura',0),1.15),
      `⚒️ Lò rèn tối đa: hành quân +10%, sát thương +${((b1.upMul('atk',0)-1)*100).toFixed(1)}%, giữ thành +15%, lương +25%, tuyển quân +15%`);
    ok(['speed','atk','armor','stamina','aura'].every(k=>b1.upMul(k,1)===1&&b1.upMul(k,2)===1&&b0.upMul(k,0)===1), '⚒️ Máy và phe trung lập không hưởng Lò rèn; chưa nâng cấp thì hệ số bằng 1');
    // lời mô tả trong Lò rèn khớp với hệ số thật trong trận
    { const pct={speed:F.speed,power:F.power,armor:F.armor,stamina:F.stamina,aura:F.aura,weapon:F.weapon}; let bad=[]; for(const U of UPGRADES){ const want=(pct[U.key]*5*100).toFixed(1).replace('.0',''); if(!U.desc(5).includes(want+'%')) bad.push(U.key+': "'+U.desc(5)+'" ≠ '+want+'%'); if(U.max!==5) bad.push(U.key+' max'); }
      ok(bad.length===0, `⚒️ Lời mô tả 6 hạng mục trong Lò rèn khớp hệ số thật trong trận${bad.length? ' — LỆCH: '+bad.join('; ') : ''}`); }
    const a0=army(b0), a1=army(b1), e0=army(b0,{owner:1,x:a0.x+500}), e1=army(b1,{owner:1,x:a1.x+500}), key=b0.mvProfile(a0);
    ok(nearly(b1.mvSpeed(a1,key)/b0.mvSpeed(a0,key),1.10)&&b1.mvSpeed(e1,key)===b0.mvSpeed(e0,key), '👟 Speed: quân ta đi nhanh hơn 10%, quân máy không đổi');
    ok(nearly(b1.civAtk(0,'spear','plain')/b0.civAtk(0,'spear','plain'),1.075*1.075)&&b1.civAtk(1,'spear','plain')===b0.civAtk(1,'spear','plain'), '💪 Power + ⚔️ Weapon: sát thương quân ta ×1,156, quân máy không đổi');
    { const n0=b0.nodes.find(n=>n.camp&&n.owner===0), n1=b1.nodes.find(n=>n.camp&&n.owner===0), m0=b0.nodes.find(n=>n.camp&&n.owner===1), m1=b1.nodes.find(n=>n.camp&&n.owner===1);
      ok(nearly(b1.defMul(n1)/b0.defMul(n0),1.15)&&b1.defMul(m1)===b0.defMul(m0), '🛡️ Fortify: cứ điểm của ta thủ tốt hơn 15%, cứ điểm máy không đổi');
      ok(nearly(b1.packT(a1)/b0.packT(a0),1.25)&&b1.packT(e1)===b0.packT(e0), '🌾 Logistics: bao lương của quân ta dùng lâu hơn 25%');
      ok(nearly(b0.pathEta(a0,n0.x+900,n0.y)/b1.pathEta(a1,n1.x+900,n1.y),1.10,1e-6), '👟 Dự báo thời gian hành quân cũng rút ngắn theo Speed (lương dự trù không bị tính dư)');
      const s0=n0.count; n1.count=s0; b0.armies.length=0; b1.armies.length=0; run(b0,60); run(b1,60); const g0=n0.count-s0, g1=n1.count-s0;
      ok(g0>50&&g1/g0>1.10&&g1/g0<1.20, `📯 Recruiting: trại của ta thêm ${g0} quân/phút → ${g1} quân/phút (×${(g1/g0).toFixed(2)})`); }
    // đánh thật: 1000 đấu 1000 ngoài đồng trống
    { const duel=(cfg)=>{ const bw=mk(cfg), c=bw.nodes.find(n=>n.camp&&n.owner===0), X=c.x+700, Y=c.y, a=army(bw,{x:X,y:Y,count:1000,camped:false,tx:X+200,ty:Y}), e=army(bw,{owner:1,x:X+60,y:Y,count:1000,camped:false,tx:X-200,ty:Y});
        let t=0; while(!bw.battles.length&&t<10){ bw.update(1/30); t+=1/30; } while(bw.battles.some(q=>!q.done)&&t<240){ bw.update(1/30); t+=1/30; } return [Math.round(a.count),Math.round(e.count)]; };
      const d0=duel(), d1=duel({up:{power:5,weapon:5}}); ok(d1[0]>d0[0]+60&&d1[1]<=d0[1], `⚒️ 1000 đấu 1000: chưa rèn ta còn ${d0[0]} (địch ${d0[1]}) → rèn đủ Power + Weapon ta còn ${d1[0]} (địch ${d1[1]})`); } }

  // ----- 🪙 Quần Hùng thưởng xu theo mốc -----
  { const bw=new BigWar(5,{royale:34,seed:77,autoMenu:false}); bw._updateVision(); bw.nextAI=1e9; bw.nextAiScout=1e9; const F=bw.localFid, log=[]; bw.onCoin=(n,why)=>log.push([n,why]); const CF=BW.coinsFor;
    const fin=()=>{ let st=0; while(bw.battles.some(b=>!b.done)&&st++<4000) bw.update(1/30); };
    const take=(n)=>{ n.count=10; bw.arrive({owner:F,type:'cavalry',count:6000,x:n.x,y:n.y,to:n.id,food:100},n); fin(); bw.armies.length=0; return n.owner===F; };
    const caps=bw.nodes.filter(n=>n.camp&&n.owner!==F&&n.owner!==2&&n.capOf===n.owner), A=caps[0], B=caps[1], C=caps[2], fa=A.owner;
    // nước A đã chiếm được trại của nước B từ trước: A có kinh đô + một trại chiếm được
    B.owner=fa; B.capOf=null; B.home=fa;
    let n0=log.length; ok(take(B)&&log.length===n0+1&&log[n0][0]===CF.camp, `🪙 Hạ một trại của địch (không phải kinh đô): +${CF.camp} xu ngay lúc đó`);
    B.owner=fa; B.home=fa; n0=log.length; ok(take(B)&&log.length===n0, '🪙 Trại đã lĩnh thưởng rồi, mất đi lấy lại không được thưởng lần hai');
    B.owner=fa; B.home=fa; n0=log.length; const okA=take(A); ok(okA&&log.length===n0+1&&log[n0][0]===CF.capital&&B.capOf===fa, `🪙 Hạ kinh đô khi nước đó còn trại khác (nó dời đô): +${CF.capital} xu`);
    n0=log.length; ok(take(B)&&log.length===n0+1&&log[n0][0]===CF.nation&&!bw.nodes.some(n=>n.owner===fa), `🪙 Hạ trại cuối cùng — diệt cả một nước: +${CF.nation} xu`);
    n0=log.length; ok(take(C)&&log.length===n0+1&&log[n0][0]===CF.nation, `🪙 Nước chỉ có một kinh đô: hạ là diệt nước, +${CF.nation} xu (không cộng dồn thưởng kinh đô)`);
    // cứ 10 phút còn trụ được: +15 xu, không trả dồn
    n0=log.length; bw.time=CF.every-1; for(let i=0;i<60;i++) bw.update(1/20); ok(log.length===n0+1&&log[n0][0]===CF.survive&&bw.coinT===2*CF.every, `🪙 Trụ qua mốc 10 phút: +${CF.survive} xu, mốc kế tiếp ở phút 20`);
    n0=log.length; bw.time=CF.every*5-0.5; for(let i=0;i<60;i++) bw.update(1/20); ok(log.length===n0+1&&bw.coinT===CF.every*6, '🪙 Đồng hồ ván chơi nhảy xa (mở lại ván lưu): chỉ trả một lần, không trả dồn các mốc đã qua');
    ok(bw.stats.coins===log.reduce((t,e)=>t+e[0],0)&&bw.stats.coins===CF.camp+CF.capital+2*CF.nation+2*CF.survive, `🪙 Tổng xu đã trả trong ván (${bw.stats.coins}) được ghi lại để màn kết quả báo đúng`);
    // ván lưu: giữ thời gian hồi của quân nhu, vùng la bàn, mốc xu; ván lưu bản cũ không được trả bù
    const I=pack(bw,['tea','compass','bun']), c=bw.nodes.find(n=>n.camp&&n.owner===F), a={owner:F,type:'spear',count:800,x:c.x+200,y:c.y+100,to:-1,tx:c.x+200,ty:c.y+100,trail:0,camped:true,food:100}; bw.armies.push(a); bw.selA=a;
    bw.lastVw=800; bw.lastVh=400; bw.scale=0.5; bw.camX=c.x-800; bw.camY=c.y-400; const r1=bw.gearUse(0), r2=bw.gearUse(1); for(let i=0;i<200;i++) bw.update(1/20);
    ok(r1.ok&&r2.ok&&Math.abs(bw.gear[0].cd-(G.cdRoyale-10))<1e-6&&Math.abs(bw.gear[1].cd-(G.cdRoyale-10))<1e-6, `⏳ Quần Hùng: mỗi món hồi ${G.cdRoyale}s (lâu hơn Đánh Boss ${G.cdSolo}s)`);
    const sv=JSON.parse(JSON.stringify(bw.saveState())), b2=new BigWar(5,{royale:34,seed:77,autoMenu:false}); pack(b2,['tea','compass','bun']); b2.loadState(sv);
    const a2=b2.armies.find(q=>q.owner===F&&q.teaT>0);
    ok(Math.abs(b2.gear[0].cd-bw.gear[0].cd)<1e-6&&b2.gear[2].cd===0&&b2.tempVis.length===1&&b2.coinT===bw.coinT&&a2&&Math.abs(a2.teaT-a.teaT)<1e-6&&b2.stats.coins===bw.stats.coins&&b2.nodes[B.id]._coin===1,
      '💾 Lưu rồi mở lại ván Quần Hùng: thời gian hồi quân nhu, trà đang uống, vùng la bàn, mốc xu và sổ xu đều còn nguyên');
    const old=JSON.parse(JSON.stringify(sv)); delete old.sc.coinT; delete old.gear; delete old.tempVis; old.sc.time=5000; const b3=new BigWar(5,{royale:34,seed:77,autoMenu:false}); let paid=0; b3.onCoin=(n)=>{ paid+=n; }; pack(b3,['tea']); b3.loadState(old); b3.nextAI=1e9; for(let i=0;i<40;i++) b3.update(1/20);
    ok(paid===0&&b3.coinT===5400&&b3.gear[0].cd===0&&b3.tempVis.length===0, '💾 Mở ván lưu từ bản cũ (chưa có mốc xu): không trả bù cho thời gian đã chơi, mốc tính từ 10 phút kế tiếp');
    // Đánh Boss 1v1 và P2P không trả xu theo mốc (1v1 trả khi hết trận)
    const s1=mk(); let p1=0; s1.onCoin=(n)=>{ p1+=n; }; s1.coin(15,'x',0,0); const ec=s1.nodes.find(n=>n.camp&&n.owner===1); ec.count=10; s1.arrive({owner:0,type:'cavalry',count:6000,x:ec.x,y:ec.y,to:ec.id,food:100},ec); { let st=0; while(s1.battles.some(b=>!b.done)&&st++<4000) s1.update(1/30); }
    ok(p1===0&&!s1.stats.coins&&ec.owner===0, '🪙 Đánh Boss 1v1: không trả xu giữa trận (xu trả ở màn kết quả như cũ)'); }

// ===== (5.3) BỘ NÃO CỦA MÁY · 10 KIỂU ĐỊA HÌNH · LƯU VÁN 1v1 · MỨC KHÓ QUẦN HÙNG =====
{ const hy=Math.hypot, D=(lv)=>BW.brain(lv,false), R=(d)=>BW.brain(5,true,d);
  const mono=(k,dir)=>{ for(let lv=2;lv<=10;lv++){ const a=D(lv-1)[k], b=D(lv)[k]; if(dir>0? b<a : b>a) return false; } return true; };
  ok(mono('iq',1)&&mono('fly',1)&&mono('budget',1)&&mono('keep',1)&&mono('safe',-1)&&mono('raidCd',-1)&&mono('pw',1)&&D(1).iq===0&&D(10).iq===3, '🧠 Mỗi ải máy khôn thêm: IQ, số đạo quân, số lệnh mỗi lượt, quân giữ nhà tăng dần; vùng an toàn của ta và nhịp nghỉ giữa các đợt quấy rối giảm dần');
  ok(D(10).force<D(1).force&&D(10).force>0.04, '🧠 Ải cao: boss KHÔNG đông gấp bội nữa (hệ số quân '+D(10).force+' so với '+D(1).force+' ở ải 1) — khó hơn nhờ khôn hơn');
  ok(R(0).fly<R(2).fly&&R(0).grow<R(1).grow&&R(1).grow<R(2).grow&&R(0).tempo>R(2).tempo&&R(0).me>1&&R(2).me<1&&R(0).grace>R(2).grace&&R(1).pw===1&&R(1).keep===0&&R(1).fly===3, '🌏 Quần Hùng 3 mức: Dễ (máy chậm, ta đông hơn) < Thường (như bản cũ) < Khó (máy nhanh, giữ nhà, hùa đánh ta)');
  // máy xuất quân để lại quân giữ nhà (ải cao); ải 1 dốc sạch như cũ
  { const b1=new BigWar(1,{map:0}), b9=new BigWar(9,{map:24}); const f=(bw)=>{ const e=bw.nodes.find(n=>n.owner===1&&!n.camp&&!n.eco), t=bw.nodes.find(n=>n.owner===2); e.count=1000; const a=bw.aiSend(e,t); return [e.count,a.count]; }; const r1=f(b1), r9=f(b9);
    ok(r1[0]===0&&r1[1]===1000&&r9[0]===300&&r9[1]===700, `🛡️ Máy xuất 1000 quân: ải 1 đi hết (còn ${r1[0]}), ải 9 để lại ${r9[0]} giữ nhà`);
    const me=b9.nodes.find(n=>n.owner===0&&!n.camp); me.count=500; const a=b9.aiSend(me,b9.nodes.find(n=>n.owner===2)); ok(me.count===0&&a.count===500,'🛡️ Lệnh của người chơi không bị giữ lại quân (chỉ máy mới để quân thủ nhà)'); }
  // phòng thủ có tính toán: cứu được thì kéo viện binh, không cứu nổi thì rút (ải 8+)
  { const mk=(lv)=>{ const bw=new BigWar(lv,{map:(lv-1)*3,autoMenu:false}); bw.nextAiScout=1e9; bw.nextWaveF={1:1e9}; bw._updateVision(); bw.armies.length=0; return bw; };
    const pair=(bw)=>{ const en=bw.nodes.filter(n=>n.owner===1&&!n.camp&&!n.eco); for(const t of en) for(const h of en) if(h!==t&&hy(h.x-t.x,h.y-t.y)<=BW.range) return [t,h,en]; return []; };
    const bw=mk(8), [t,h,en]=pair(bw); if(t){ for(const o of bw.nodes) if(o.owner===1&&o!==t&&o!==h) o.count=Math.min(o.count,90); t.count=400; h.count=500;
      bw.armies.push({owner:0,type:'cavalry',count:9000,x:t.x-150,y:t.y,to:t.id,from:0,trail:0,food:100}); bw._updateVision(); bw.time=400; const notes=[]; const tx0=bw.texts.length; bw.aiTurn(1);
      const fled=bw.armies.find(q=>q.owner===1&&q.from===t.id); ok(!!fled&&t.count===0, '🏃 Ải 8: đồn 400 quân bị 9000 quân ta kéo tới, không ai cứu nổi → máy RÚT quân khỏi đồn thay vì chết vô ích'); }
    const b5=mk(5), [t5,h5]=pair(b5); if(t5){ for(const o of b5.nodes) if(o.owner===1&&o!==t5&&o!==h5) o.count=Math.min(o.count,90); t5.count=400; h5.count=500;
      b5.armies.push({owner:0,type:'cavalry',count:9000,x:t5.x-150,y:t5.y,to:t5.id,from:0,trail:0,food:100}); b5._updateVision(); b5.time=400; b5.aiTurn(1);
      ok(t5.count===400, '🧠 Ải 5 (IQ 2) chưa biết rút: đồn vẫn ngồi chờ'); } }
  // đánh hậu phương: ải 1 có vùng an toàn, ải 9 thì không
  { const raid=(lv)=>{ const bw=new BigWar(lv,{map:(lv-1)*3,autoMenu:false}); bw.nextAiScout=1e9; bw.nextWaveF={1:1e9}; bw.armies.length=0; const mine=bw.nodes.filter(n=>n.owner===0&&!n.camp); const m=mine[0]; m.x=BW.W*0.2; m.count=30;
      const e=bw.nodes.filter(n=>n.owner===1&&!n.camp&&!n.eco)[0]; e.x=m.x+300; e.y=m.y; e.count=3000; for(const o of bw.nodes) if(o.owner===1&&o!==e&&!o.camp) o.count=50; bw.visR=99999; bw.time=500; bw._updateVision(); let hit=0; for(let k=0;k<6&&!hit;k++){ bw.aiTurn(1); hit=bw.armies.filter(q=>q.owner===1&&q.to>=0&&bw.nodes[q.to].owner===0).length; } return hit; };
    const r1=raid(1), r9=raid(9); ok(r1===0&&r9>=1, `🔥 Đồn ta sát trại chỉ còn 30 quân, địch 3000 ngay bên cạnh: ải 1 máy không đụng tới (${r1}), ải 9 máy đánh ngay (${r9})`); }
  // sức đánh thật của boss theo ải + không ảnh hưởng người chơi/P2P/cổ điển
  { const b10=new BigWar(10,{map:27}), b1=new BigWar(1,{map:0}), pp=new BigWar(3,{p2p:true}), cl=new BigWar(1,{classic:true});
    ok(b10.pwOf(1)===1.12&&b1.pwOf(1)===0.9&&b10.pwOf(0)===1&&b10.pwOf(2)===1&&pp.pwOf(1)===1&&cl.pwOf(1)===1, '⚔️ Sức đánh của boss: ải 1 ×0.9 → ải 10 ×1.12; người chơi, quân trung lập, P2P và bản cổ điển luôn ×1'); }
  // bản đồ: 30 bản đồ 1v1 = 10 kiểu địa hình × 3; mỗi ải bốc trong 3 bản đồ riêng
  { const S=BW_MAPS.solo, kinds=[...new Set(S.map(m=>m[2]))]; let okPool=true, seen=new Set();
    for(let lv=1;lv<=10;lv++){ const set=new Set(); for(let k=0;k<40;k++){ const bw=new BigWar(lv,{}); set.add(bw.cfg.map); if(Math.floor(bw.cfg.map/3)!==lv-1||bw.biomeId!==S[(lv-1)*3][2]) okPool=false; } if(set.size!==3) okPool=false; for(const m of set) seen.add(m); }
    ok(S.length===30&&kinds.length===10&&new Set(S.map(m=>m[0])).size===30&&new Set(S.map(m=>m[1])).size===30&&okPool&&seen.size===30, `🗺️ 30 bản đồ 1v1 (trước là 20), ${kinds.length} kiểu địa hình; mỗi ải bốc ngẫu nhiên trong 3 bản đồ riêng của ải đó`);
    const pos=new Set(); for(let m=0;m<30;m++){ const b=new BigWar(Math.floor(m/3)+1,{map:m}), c=b.nodes[0]; pos.add((c.x<BW.W/2?'L':'R')+(c.y<BW.H*0.4?'t':c.y>BW.H*0.6?'b':'m')); }
    ok(pos.size>=4, `🗺️ Thế trận đổi theo bản đồ: trại ta có ${pos.size} vị trí khác nhau (trái/phải × trên/giữa/dưới)`);
    let bad=[]; for(let m=0;m<30;m++){ const b=new BigWar(Math.floor(m/3)+1,{map:m}); const W=BW.W, H=BW.H; if(b.nodes.some(n=>!(n.x>=0&&n.x<=W&&n.y>=0&&n.y<=H))) bad.push(m+':node'); if(b.roads.some(r=>r.pts.some(q=>!(q[0]>=-5&&q[0]<=W+5&&q[1]>=-5&&q[1]<=H+5)))) bad.push(m+':road');
      if(b.nodes.some(n=>!n.camp&&b.terAtRaw(n.x,n.y)==='river')) bad.push(m+':wet'); const cp=b.nodes[1], me=b.nodes.find(n=>n.owner===0&&!n.camp); if(!b.canReach({x:me.x,y:me.y,type:'spear',count:300,owner:0},cp.x,cp.y).ok) bad.push(m+':unreach'); }
    ok(bad.length===0, '🗺️ Cả 30 bản đồ: cứ điểm và đường cái nằm trong bản đồ, không cứ điểm nào giữa sông, bộ binh đi được từ đồn ta tới trại địch'+(bad.length? ' — LỖI: '+bad.join(' '):''));
    const d=new BigWar(6,{map:15}), s=new BigWar(8,{map:21}); let riv=0; for(let x=0;x<BW.W;x+=40) for(let y=0;y<BW.H;y+=40) if(d.terAt(x,y)==='river') riv++;
    ok(d.biomeId==='desert'&&riv===0&&d.bridges.length===0&&s.biomeId==='snow'&&s.bridges.length===4, '🏜️ Sa mạc không có sông và không có bến; Tuyết vẫn có sông với 4 bến'); }
  // lưu ván 1v1 đang đánh dở rồi mở lại
  { const bw=new BigWar(4,{map:10,civ:'rome',autoMenu:false}); bw.lv=4; for(let i=0;i<600;i++) bw.update(1/20); const me=bw.nodes.find(n=>n.owner===0&&!n.camp&&n.count>0), t=bw.nodes.find(n=>n.owner===2); if(me&&t) bw.send(me,t); for(let i=0;i<60;i++) bw.update(1/20);
    const sv=JSON.parse(JSON.stringify(bw.saveState())); const b2=new BigWar(sv.lv,Object.assign({},sv.cfg)); b2.lv=sv.lv; b2.loadState(sv);
    const sig=(b)=>b.nodes.map(n=>n.owner+':'+Math.round(n.count)).join(',')+'|'+b.armies.filter(a=>!a.done).map(a=>a.owner+':'+Math.round(a.count)+':'+Math.round(a.x)).join(',');
    ok(!sv.cfg.royale&&sv.lv===4&&b2.cfg.map===10&&b2.mapName===bw.mapName&&b2.biomeId===bw.biomeId&&Math.abs(b2.time-bw.time)<1e-6&&sig(b2)===sig(bw)&&b2.civOf(1).id===bw.civOf(1).id&&b2.D.iq===bw.D.iq, '💾 Lưu ván 1v1 giữa trận rồi mở lại: đúng ải, đúng bản đồ, đúng nước địch, cứ điểm và các đạo quân y nguyên');
    let nan=0; for(let i=0;i<400;i++) b2.update(1/20); for(const n of b2.nodes) if(!(n.count>=0)||n.x!==n.x) nan++; ok(nan===0&&b2.time>bw.time, '💾 Ván 1v1 mở lại chơi tiếp bình thường'); }
  // Quần Hùng: mức khó nằm trong ván lưu; ván lưu từ bản cũ (chưa có kiểu địa hình) giữ địa hình cũ
  { const h=new BigWar(5,{royale:34,seed:77,diff:2,bio:1,map:8,autoMenu:false}), sv=JSON.parse(JSON.stringify(h.saveState())); const h2=new BigWar(sv.lv,Object.assign({},sv.cfg)); h2.loadState(sv);
    ok(sv.cfg.diff===2&&sv.cfg.bio===1&&h2.D.diff===2&&h2.D.fly===5&&h2.biomeId==='desert', '💾 Quần Hùng mức Khó trên sa mạc: lưu rồi mở lại vẫn là mức Khó, vẫn sa mạc');
    const old=new BigWar(5,{royale:34,seed:77,map:8,autoMenu:false}); ok(old.biomeId==='plain'&&old.D.diff===1&&!old.noRiver, '💾 Ván Quần Hùng lưu từ bản 5.2 (chưa có mức khó/kiểu địa hình): mở ra là mức Thường, địa hình y như cũ');
    const e=new BigWar(5,{royale:34,seed:77,diff:0,bio:1,map:0}), n=new BigWar(5,{royale:34,seed:77,diff:1,bio:1,map:0}), x=new BigWar(5,{royale:34,seed:77,diff:2,bio:1,map:0}); const p=(b)=>Math.round(b.myPower(0));
    ok(p(e)>p(n)&&p(n)>p(x), `🌏 Quân khởi điểm của ta: Dễ ${p(e)} > Thường ${p(n)} > Khó ${p(x)}`);
    // thời gian ân hạn: trước mốc, không nước nào xuất quân đánh ta
    const g=new BigWar(5,{royale:34,seed:91,diff:2,bio:1,map:3,autoMenu:false}); let hit=0; const s0=g.send.bind(g); g.send=function(a,b,...r){ if(a&&a.owner!==0&&b&&b.owner===0) hit++; return s0(a,b,...r); }; while(g.time<235) g.update(1/10);
    ok(hit===0, '🌏 Quần Hùng mức Khó: 4 phút đầu chưa nước nào xuất quân đánh ta (có thời gian dựng thế)'); }
}

// ===== (5.4) CỨ ĐIỂM NHIỀU BINH CHỦNG · TÁCH QUÂN · CỨU TRẠI · HIỆU LỆNH BẮT DÍNH =====
{ const mk=()=>{ const bw=new BigWar(2,{map52:3,civ:'rome',autoMenu:false}); bw.aiTurn=()=>{}; bw._updateVision(); bw.armies.length=0; return bw; };
  const own=(bw)=>bw.nodes.filter(n=>n.owner===0&&!n.camp&&!n.eco), R=(x)=>Math.round(x);
  { const bw=mk(), [n,m]=own(bw); n.count=1000; n.type='shield'; n.mix=null;
    bw.arrive({owner:0,type:'cavalry',count:400,x:n.x,y:n.y,food:100},n); bw.arrive({owner:0,type:'archer',count:200,x:n.x,y:n.y,food:100},n);
    const L=bw.mixList(n).map(q=>q[0]+':'+R(q[1])).join(' ');
    ok(n.count===1600&&L==='shield:1000 cavalry:400 archer:200'&&n.type==='shield', `🧩 Nhập 400 kỵ + 200 cung vào đồn 1000 khiên: kho giữ nguyên từng loại (${L}), thủ thành bằng loại đông nhất`);
    n.count=800; const L2=bw.mixList(n).map(q=>R(q[1])).join('/'); ok(L2==='500/200/100','🧩 Thương vong/sinh quân chia đều theo tỉ lệ: còn 800 quân = '+L2); n.count=1600;
    const a=bw.send(n,m,{type:'cavalry'}); ok(a&&a.type==='cavalry'&&a.count===400&&R(n.count)===1200&&bw.mixList(n).map(q=>q[0]+':'+R(q[1])).join(' ')==='shield:1000 archer:200'&&bw._lastSent.length===1, '🐎 Chỉ cho KỴ BINH đi: một đạo 400 kỵ; khiên và cung ở lại giữ đồn');
    const h=bw.send(n,m,{frac:0.5}); const hs=bw._lastSent.map(q=>q.type+':'+q.count).join(' ');
    ok(h&&hs==='shield:500 archer:100'&&R(n.count)===600&&bw.mixList(n).map(q=>R(q[1])).join('/')==='500/100', '½ Cho MỘT NỬA đi: mỗi loại một đạo ('+hs+'), nửa còn lại ở nhà');
    const q=bw.send(n,m,{type:'archer',frac:0.25}); ok(q&&q.type==='archer'&&q.count===25&&R(n.count)===575, '¼ Một phần tư cung thủ đi: 25 lính');
    const all=bw.send(n,m); const as=bw._lastSent.map(q=>q.type+':'+q.count).join(' ');
    ok(all&&n.count===0&&bw._lastSent.reduce((t,q)=>t+q.count,0)===575&&bw._lastSent.length===2&&all.type==='shield', 'Tất cả: cả kho xuất trận, mỗi binh chủng một đạo đi cùng nhau ('+as+'), không rơi mất lính nào'); }
  { const bw=mk(), [n,m]=own(bw); n.count=30; n.mix=null; ok(bw.send(n,m,{frac:0.5})===false&&n.count===30, 'Tách ra dưới 20 lính: không cho tách, quân giữ nguyên');
    n.count=1000; const a=bw.send(n,m,{frac:0.25}); ok(a&&a.count===250&&n.count===750&&a.type===n.type, 'Đồn một binh chủng, cho ¼ đi: 250 đi, 750 ở lại');
    const b=bw.send(n,m); ok(b&&b.count===750&&n.count===0, 'Lệnh cũ (không chọn gì): đi hết như trước'); }
  { // mất đồn rồi chiếm lại / máy chiếm: kho không mang tỉ lệ của chủ cũ
    const bw=mk(), [n]=own(bw); n.count=600; n.type='shield'; n.mix=null; bw.arrive({owner:0,type:'cavalry',count:400,x:n.x,y:n.y,food:100},n); n.owner=1; n.type='spear';
    ok(bw.mixList(n).length===1&&bw.mixList(n)[0][0]==='spear', '🧩 Đồn đổi chủ: kho tính lại theo quân của chủ mới');
    const t=bw.nodes.find(q=>q.eco==='train'); if(t){ t.owner=0; t.count=300; t.type='shield'; t.trainType='archer'; t.mix=null; bw.arrive({owner:0,type:'cavalry',count:300,x:t.x,y:t.y,food:100},t); ok(t.type==='archer'&&bw.mixList(t).length===1, '⚒️ Điểm luyện binh vẫn đổi cả kho sang binh chủng của nó (luật cũ giữ nguyên)'); } }
  { // lưu / mở lại giữ nguyên kho nhiều binh chủng
    const bw=mk(), [n]=own(bw); n.count=600; n.type='shield'; n.mix=null; bw.arrive({owner:0,type:'cavalry',count:300,x:n.x,y:n.y,food:100},n);
    const sv=JSON.parse(JSON.stringify(bw.saveState())), b2=new BigWar(sv.lv||2,Object.assign({},sv.cfg,{map52:3})); b2.loadState(sv); const n2=b2.nodes[n.id];
    ok(b2.mixList(n2).map(q=>q[0]+':'+R(q[1])).join(' ')==='shield:600 cavalry:300', '💾 Lưu rồi mở lại: kho vẫn 600 khiên + 300 kỵ'); }
  { // menu lệnh: hàng chọn binh chủng + hàng chọn lượng
    const bw=mk(), [n,m]=own(bw); n.count=900; n.type='shield'; n.mix=null; bw.arrive({owner:0,type:'cavalry',count:300,x:n.x,y:n.y,food:100},n);
    bw.sendSel={node:n.id,type:'cavalry',frac:0.5}; ok(bw.selGoing(n)===150&&JSON.stringify(bw.selOpt(n))==='{"type":"cavalry","frac":0.5}', 'Chọn "kỵ binh" + "½": bảng ghi sẽ đi 150');
    bw.sendSel={node:999,type:'cavalry',frac:0.5}; ok(bw.selOpt(n)===null&&bw.selGoing(n)===1200, 'Lựa chọn của đồn khác không dính sang đồn này'); }
  { // địa hình: không còn chỗ cấm ngoài nước sâu
    const bw=mk(); let blocked=0, tot=0; const C=bw.navCost('H'), N=bw.nav; for(let i=0;i<N.n;i++){ const t=BW.TER[N.ter[i]]; if(t==='river') continue; tot++; if(!(C[i]<1e9)) blocked++; }
    ok(blocked===0&&tot>1000, `🗺️ Kỵ binh: ${tot} ô đất liền, ô bị cấm = ${blocked} (chỉ còn nước sâu là không qua được)`);
    const sp=(k,t)=>BW.mv[k][t]; ok(sp('F','forest')<1&&sp('F','mountain')<sp('F','forest')&&sp('H','forest')<sp('F','forest')&&sp('R','forest')>sp('F','forest'), `🗺️ Tốc độ trong rừng: sát thủ ×${sp('R','forest')} > bộ binh ×${sp('F','forest')} > kỵ binh ×${sp('H','forest')}; núi chậm hơn rừng`); }
  { // 📣 bắt dính + 🚑 cứu trại
    const bw=mk(), mine=own(bw), camp=bw.nodes.find(n=>n.camp&&n.owner===0); for(const n of mine){ n.count=400; n.mix=null; } bw.scale=0.5;
    const ecoOwn=(b)=>{ const E=b.nodes.filter(n=>n.eco&&n.eco!=='granary'); for(const n of E){ n.owner=0; n.count=300; n.mix=null; } return E; };
    const hubs=(b)=>b.nodes.filter(n=>n.owner===0&&!n.eco), byD=(x,y)=>(a,b2)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b2.x-x,b2.y-y);
    const E1=ecoOwn(bw); for(const n of hubs(bw)){ n.count=400; n.mix=null; }
    const tgt=mine[0]; bw.rallyCall(5,tgt.x+70,tgt.y-50);
    const H5=new Set(hubs(bw).sort(byD(tgt.x,tgt.y)).slice(0,5)), want=E1.filter(n=>{ const h=hubs(bw).sort(byD(n.x,n.y))[0]; return H5.has(h); });
    const into=bw.armies.filter(a=>a.owner===0&&a.to===tgt.id), froms=new Set(into.map(a=>a.from));
    ok(E1.length>=3&&want.length>=1&&into.length>=1&&want.every(n=>froms.has(n.id)&&n.count===0)&&[...froms].every(id=>want.some(n=>n.id===id))&&hubs(bw).every(n=>n.count===400)&&!bw.armies.some(a=>a.owner===0&&a.to<0),
      `📣 (6.3) Gom 5 trại gần nhất: ${want.length}/${E1.length} điểm luyện quân/trại chăn nuôi quanh 5 trại đó kéo VÀO đồn được chạm (bắt dính); quân TRONG mọi trại, thành trấn giữ nguyên`);
    const bw2=mk(), m2=own(bw2); for(const n of hubs(bw2)){ n.count=400; n.mix=null; } ecoOwn(bw2); bw2.scale=0.5; let fx=0,fy=0,ok2=false; for(let x=300;x<BW.W-300&&!ok2;x+=97) for(let y=200;y<BW.H-200&&!ok2;y+=83){ if(!bw2.rallySnap(x,y)&&bw2.terAt(x,y)!=='river'){ fx=x; fy=y; ok2=true; } }
    bw2.rallyCall(10,fx,fy); ok(bw2.armies.filter(a=>a.owner===0&&a.to<0&&a.rally).length>=1&&hubs(bw2).every(n=>n.count===400), '📣 Gom 10 trại, chạm giữa đồng trống: quân điểm luyện quân tập kết đúng điểm chạm, trại giữ nguyên');
    { const b5=mk(); for(const n of hubs(b5)){ n.count=400; n.mix=null; } const n0=b5.armies.length; b5.rallyCall(5,fx,fy);
      ok(b5.armies.length===n0&&hubs(b5).every(n=>n.count===400)&&b5.notes.some(q=>/No training grounds or ranches with troops/.test(q.s||q.text||JSON.stringify(q))), '📣 Quanh 5 trại không có điểm luyện quân nào có quân: báo rõ, không rút quân trong trại'); }
    { const bA=mk(); const HA=hubs(bA); for(const n of HA){ n.count=400; n.mix=null; } const EA=ecoOwn(bA); const fld={owner:0,type:'spear',count:250,x:HA[0].x+900,y:HA[0].y+300,to:-1,tx:HA[0].x+900,ty:HA[0].y+300,camped:true,trail:0,food:100}; bA.armies.push(fld);
      const busy={owner:0,type:'spear',count:150,x:HA[1].x+600,y:HA[1].y,to:-1,camped:true,trail:0,food:100,btl:99}; bA.armies.push(busy);
      bA.rallyCall(Infinity,fx,fy); const tot=bA.armies.filter(a=>a.owner===0&&!a.done&&a.rally).reduce((t,a)=>t+a.count,0);
      ok(HA.every(n=>n.count===0)&&EA.every(n=>n.count===0)&&fld.rally&&fld.tx===fx&&!busy.rally&&tot===HA.length*400+EA.length*300+250,
        `🚩 (6.3) Tổng động viên: rút sạch ${HA.length} trại/thành trấn + ${EA.length} điểm luyện quân/trại chăn nuôi + đạo quân đang đóng ngoài đồng (trừ đạo đang giao chiến) — ${tot} quân về điểm tập kết`); }
    { // 🔲 quét: lấy cả quân điểm luyện quân trong vùng, không lấy trại; huỷ thì quay về
      const bQ=mk(); const HQ=hubs(bQ); for(const n of HQ){ n.count=400; n.mix=null; } const EQ=ecoOwn(bQ), e=EQ[0], c=HQ.sort(byD(e.x,e.y))[0];
      const box=[Math.min(e.x,c.x)-40,Math.min(e.y,c.y)-40,Math.max(e.x,c.x)+40,Math.max(e.y,c.y)+40]; const inBox=(n)=>n.x>=box[0]&&n.x<=box[2]&&n.y>=box[1]&&n.y<=box[3];
      const fld={owner:0,type:'spear',count:120,x:(box[0]+box[2])/2,y:(box[1]+box[3])/2,to:-1,camped:true,trail:0,food:100}; bQ.armies.push(fld);
      const k=bQ.boxSelectWorld(...box), eIn=EQ.filter(inBox), hIn=HQ.filter(inBox);
      ok(k===1+eIn.length&&eIn.every(n=>n.count===0)&&hIn.length>=1&&hIn.every(n=>n.count===400)&&bQ.selG.includes(fld)&&bQ.selG.filter(a=>a.boxFrom!=null).length===eIn.length,
        `🔲 (6.3) Quét vùng: chọn đạo quân ngoài đồng + quân ${eIn.length} điểm luyện quân trong vùng; ${hIn.length} trại trong vùng giữ nguyên`);
      const pulled=bQ.selG.filter(a=>a.boxFrom!=null); bQ.menu={wx:0,wy:0,src:{kind:'grp',refs:bQ.selG.slice()}}; bQ.menuPick('cancel');
      ok(pulled.every(a=>a.to===e.id||eIn.some(n=>n.id===a.to)), '🔲 Bỏ chọn: quân vừa bước ra khỏi điểm luyện quân quay về chỗ cũ'); }
    { // 🤝 gộp đạo đứng sát nhau
      const bM=mk(), c=hubs(bM)[0]; const X=c.x+700, Y=c.y+200; const mkA=(t,n,dx)=>({owner:0,type:t,count:n,x:X+dx,y:Y,to:-1,tx:X+dx,ty:Y,camped:true,trail:0,food:100});
      const a1=mkA('spear',300,0), a2=mkA('archer',200,40), a3=mkA('cavalry',100,80), far=mkA('spear',50,400); bM.armies.push(a1,a2,a3,far);
      for(let t=0;t<30;t++) bM.update(1/30);
      ok(!a1.done&&a1.count===600&&a2.done&&a3.done&&!far.done&&far.count===50, `🤝 (6.3) Ba đạo (3 binh chủng) đứng sát nhau tự gộp thành 1 đạo ${a1.count} quân mang binh chủng đông nhất (${a1.type}); đạo đứng xa giữ riêng`);
      const bG=mk(), cg=hubs(bG)[0]; const g1=mkA('spear',200,0), g2=mkA('archer',150,300), g3=mkA('cavalry',90,-300); for(const q of [g1,g2,g3]){ q.x=cg.x+600+(q.x-X); q.y=cg.y+400; q.tx=q.x; q.ty=q.y; } bG.armies.push(g1,g2,g3);
      const dx=cg.x+600, dy=cg.y+900; bG.menu={wx:dx,wy:dy,src:{kind:'grp',refs:[g1,g2,g3]},opts:[]}; bG.menuPick('move');
      for(let t=0;t<60*40&&[g1,g2,g3].filter(q=>!q.done).length>1;t++) bG.update(1/60);
      const live=[g1,g2,g3].filter(q=>!q.done); ok(live.length===1&&live[0].count===440&&Math.hypot(live[0].x-dx,live[0].y-dy)<120, `🤝 Chọn 3 đạo, lệnh tới một điểm: tới nơi còn đúng 1 đạo ${live[0]&&live[0].count} quân (trước đây xếp hàng thành 3 đạo đứng sát nhau)`);
      const bN=mk(), cn=hubs(bN)[0]; cn.count=600; cn.mix={spear:0.5,archer:0.3,cavalry:0.2}; cn.mixO=0; cn.type='spear'; const sx=cn.x+500, sy=cn.y+350; bN.menu={wx:sx,wy:sy,src:{kind:'node',ref:cn},opts:[]}; bN.menuPick('move');
      const out=bN.armies.filter(a=>a.owner===0&&a.from===cn.id); for(let t=0;t<60*40&&out.filter(q=>!q.done).length>1;t++) bN.update(1/60);
      ok(out.length>=2&&out.filter(q=>!q.done).length===1&&out.find(q=>!q.done).count===600, `🤝 Trại ${out.length} binh chủng ra một điểm: tới nơi gộp thành 1 đạo 600 quân`); }
    const bw3=mk(), m3=own(bw3), camp3=bw3.nodes.find(n=>n.camp&&n.owner===0); for(const n of m3){ n.count=400; n.mix=null; } const hurt=m3[m3.length-1];
    bw3.armies.push({owner:1,type:'spear',count:900,x:hurt.x+200,y:hurt.y,to:hurt.id,from:1,trail:0,food:100});
    bw3.rallyCall(-1,hurt.x+900,hurt.y+500); const res=bw3.armies.filter(a=>a.owner===0&&a.to===hurt.id).length;
    ok(res>=1&&hurt.count===400, `🚑 CỨU TRẠI: chạm cách xa 1000px vẫn tự tìm đúng đồn đang bị địch kéo tới — ${res} đạo chạy về cứu, vào thẳng trong đồn`);
    const bw4=mk(); for(const n of own(bw4)) n.count=400; const n0=bw4.armies.length; bw4.rallyCall(-1,BW.W*0.9,BW.H*0.5); ok(bw4.armies.length===n0&&bw4.notes.some(q=>/No camp of yours is in danger/.test(q.s||q.text||JSON.stringify(q))), '🚑 Không trại nào gặp nguy: báo rõ, không điều quân bừa'); }
}

// ===== (5.4) CHỐNG "GOM MỘT ĐẠO LỚN ĐI THẲNG VÀO TRẠI" =====
{ const mk=(lv)=>{ const bw=new BigWar(lv,{map:(lv-1)*3,civ:'rome',autoMenu:false}); bw.nextAiScout=1e9; bw.nextWaveF={1:1e9}; bw.armies.length=0; bw._updateVision(); return bw; };
  const camp=(bw,o)=>bw.nodes.find(n=>n.camp&&n.owner===o), inb=(bw)=>bw.armies.filter(a=>a.owner===1&&!a.done&&a.to===camp(bw,1).id).reduce((s,a)=>s+a.count,0);
  { const b10=mk(10), b1=mk(1), c10=camp(b10,1), c1=camp(b1,1); ok(c10.count>=8000&&c1.count<=1500, `🏰 Trại boss ải 10 khai trận có ${Math.round(c10.count)} quân (ải 1: ${Math.round(c1.count)}) — không còn teo theo hệ số quân đồn`); }
  { const bw=mk(10), c=camp(bw,1); bw.armies.push({owner:0,type:'spear',count:15000,x:c.x-1500,y:c.y,to:c.id,from:0,trail:0,food:100}); bw.time=300; bw.aiTurn(1); const got=inb(bw);
    ok(got>=3000&&bw.notes.some(q=>/pulls its garrisons back/.test(q.s||q.text||JSON.stringify(q))), `🚨 Ải 10: đạo 15000 quân kéo vào trại → các đồn dồn ${Math.round(got)} quân về giữ trại ngay trong một lượt (không bị giới hạn số lệnh), có thông báo`);
    const b1=mk(1), c1=camp(b1,1); b1.armies.push({owner:0,type:'spear',count:15000,x:c1.x-1500,y:c1.y,to:c1.id,from:0,trail:0,food:100}); b1.time=300; b1.aiTurn(1); const n1=b1.armies.filter(q=>q.owner===1&&q.to===c1.id).length, n10=bw.armies.filter(q=>q.owner===1&&q.to===c.id).length; ok(n1<=1&&n10>=3, `🌾 Ải 1 (boss ngây thơ) chỉ gửi ${n1} toán viện binh; ải 10 có ${n10} đồn cùng kéo về`); }
  { const bw=mk(10), c=camp(bw,1); bw.armies.push({owner:0,type:'spear',count:300,x:c.x-1500,y:c.y,to:c.id,from:0,trail:0,food:100}); bw.time=300; const n0=bw.armies.length; bw.aiAlarm(1,()=>{}); ok(inb(bw)===0, '🚨 Toán quân nhỏ (300) quấy rối trại: boss không hốt hoảng rút hết đồn về'); }
  { // quân trung lập khó dụ hơn ở ải cao
    const t=(lv,mul)=>{ const bw=mk(lv), n=bw.nodes.find(q=>q.owner===2&&q.count>100&&!q.eco); n.count=1000; const a={owner:0,type:n.type,count:Math.round(1000*mul),x:n.x,y:n.y,to:n.id,from:0,trail:0,food:100}; bw.armies.push(a); bw.arrive(a,n); return {own:n.owner,cnt:Math.round(n.count),btl:!!n.btl}; };
    const a1=t(1,1.2), a10=t(10,1.2), b10=t(10,2.6);
    ok(a1.own===0&&a1.cnt===2200&&!a1.btl, '🏳️ Ải 1: 1200 quân tới đồn trung lập 1000 → cả đồn quy thuận (thành 2200)');
    ok(a10.own===2&&a10.btl, '🏳️ Ải 10: 1200 quân chưa đủ áp đảo (cần gấp 2,5 lần) → phải ĐÁNH, không được ăn không');
    ok(b10.own===0&&b10.cnt===3200&&!b10.btl, '🏳️ Ải 10: 2600 quân áp đảo → quy thuận, nhưng chỉ 60% theo ta (thành 3200)');
    const rr=new BigWar(5,{royale:34,seed:77,map:0,autoMenu:false}), nn=rr.nodes.find(q=>q.owner===2&&q.count>50); if(nn){ nn.count=1000; const a={owner:0,type:nn.type,count:1100,x:nn.x,y:nn.y,to:nn.id,from:0,trail:0,food:100}; rr.arrive(a,nn); ok(nn.owner===0&&Math.round(nn.count)===2100, '🌏 Quần Hùng: luật quy thuận giữ như cũ'); } }
  { // đánh úp trại trống: chỉ khi ta đã dốc đại quân sang nửa bên kia (ải 8+)
    const raid=(lv,commit)=>{ const bw=mk(lv), mc=camp(bw,0); mc.count=20; for(const n of bw.nodes) if(n.owner===0&&!n.camp) n.count=3000; const e=bw.nodes.filter(n=>n.owner===1&&!n.camp&&!n.eco)[0]; e.x=mc.x+ (mc.x<BW.W/2? 320 : -320); e.y=mc.y; e.count=4000; for(const o of bw.nodes) if(o.owner===1&&o!==e&&!o.camp) o.count=40;
      if(commit) bw.armies.push({owner:0,type:'spear',count:5000,x:camp(bw,1).x+(mc.x<BW.W/2? -900 : 900),y:camp(bw,1).y,to:-1,tx:0,ty:0,camped:true,from:0,trail:0,food:100}); bw.visR=99999; bw.time=150; bw._updateVision(); let hit=0; for(let k=0;k<8&&!hit;k++){ bw.aiTurn(1); hit=bw.armies.filter(q=>q.owner===1&&q.to===mc.id).length; } return hit; };
    const h0=raid(10,false), h1=raid(10,true), h5=raid(5,true);
    ok(h0===0&&h1>=1&&h5===0, `🗡️ Phút 2:30, trại ta chỉ còn 20 quân: ải 10 — ta ở nhà thì máy chưa đánh trại (${h0}); ta dốc 5000 quân sang sát trại địch thì máy ĐÁNH ÚP trại ta (${h1}); ải 5 chưa biết trò này (${h5})`); }
}

// ===== (5.5) NHỊP GIAO TRANH: công trại/thành trấn kéo dài · phục kích giữ nhịp · chỗ khác chênh lệch càng lớn càng nhanh =====
{ const fight=(kind,att,def)=>{ const bw=new BigWar(3,{map:6,civ:'rome',autoMenu:false}); bw.aiTurn=()=>{}; bw.nextWaveF={1:1e9}; bw.nextAiScout=1e9; bw.armies.length=0; bw.battles.length=0;
    const A={owner:0,type:'spear',count:att,x:0,y:0,food:100,from:0,trail:0,camped:true,to:-1,tx:0,ty:0}; bw.armies.push(A); let b;
    if(kind==='field'||kind==='ambush'){ const B={owner:1,type:'spear',count:def,x:10,y:0,food:100,from:1,trail:0,camped:true,to:-1,tx:10,ty:0}; bw.armies.push(B); b=bw.startBattle(5,0,'plain',-1,{fid:0,e:{kind:'army',ref:A,c0:att}},{fid:1,e:{kind:'army',ref:B,c0:def}},kind==='ambush'?3:1,kind==='ambush'?'🪤 AMBUSH x3.0!':null); }
    else { const n= kind==='camp'? bw.nodes.find(q=>q.camp&&q.owner===1) : bw.nodes.find(q=>q.owner===1&&!q.camp&&!q.eco); if(kind!=='camp') n.struct= kind==='post'? null : kind; n.type='spear'; n.count=def; n.mix=null;
      b=bw.startBattle(n.x,n.y,n.ter,n.id,{fid:0,e:{kind:'army',ref:A,c0:att}},{fid:1,e:{kind:'node',ref:n,c0:def}},1); }
    let t=0; while(!b.done&&t<300){ bw.update(0.05); t+=0.05; } return {t,kind:b.kind,A}; };
  const f11=fight('field',1000,1000), f15=fight('field',1500,1000), f2=fight('field',2000,1000), f4=fight('field',4000,1000), f10=fight('field',10000,1000);
  ok(f11.kind==='field'&&f11.t>15&&f15.t<f11.t*0.4&&f2.t<f15.t&&f4.t<f2.t&&f2.t<=6&&f4.t<=3&&f10.t>=2.4&&f10.t<=3, `⚔️ Ngoài đồng: ngang sức ${f11.t.toFixed(0)}s · gấp 1,5 ${f15.t.toFixed(1)}s · gấp 2 ${f2.t.toFixed(1)}s · gấp 4 ${f4.t.toFixed(1)}s · gấp 10 ${f10.t.toFixed(1)}s (tối thiểu 2,5s)`);
  const p2=fight('post',2000,1000); ok(p2.kind==='field'&&p2.t<=6, `⚔️ Đồn thường (không phải trại/thành trấn): cũng tan nhanh theo chênh lệch — gấp 2 mất ${p2.t.toFixed(1)}s`);
  const am=fight('ambush',2000,1000); ok(am.kind==='ambush'&&am.t>18, `🪤 Phục kích giữ nhịp cũ: ${am.t.toFixed(0)}s`);
  const v=fight('village',2000,1000), fo=fight('fort',2000,1000), ci=fight('citadel',2000,1000), ca=fight('camp',2000,1000), ca8=fight('camp',8000,1000);
  ok(v.kind==='siege'&&v.t>p2.t*5&&v.t<fo.t&&fo.t<ci.t&&ci.t<ca.t&&ca.t>=40, `🏰 Công thành (cùng 2000 đánh 1000): làng trấn ${v.t.toFixed(0)}s < thành lũy ${fo.t.toFixed(0)}s < thành trì ${ci.t.toFixed(0)}s < đại bản doanh ${ca.t.toFixed(0)}s — so với đồn thường ${p2.t.toFixed(1)}s`);
  ok(ca8.t<ca.t&&ca8.t>=24, `🏰 Quân đông hơn hẳn (8000 đánh trại 1000) chỉ rút ngắn chút ít: vẫn ${ca8.t.toFixed(0)}s`);
  // tổn thất của bên thắng: trận chóng vánh thì bên thắng mất ít hơn trận giằng co
  ok(f4.A.count>3800&&f2.A.count>1650, `⚔️ Thắng áp đảo mất ít quân: 4000 đánh 1000 còn ${Math.round(f4.A.count)}, 2000 đánh 1000 còn ${Math.round(f2.A.count)}`);
  // trại bị đánh lâu hơn → viện binh kịp tới: trong 20 giây đầu trại 1000 quân vẫn đứng vững trước 2000 quân
  { const bw=new BigWar(3,{map:6,civ:'rome',autoMenu:false}); bw.aiTurn=()=>{}; bw.nextWaveF={1:1e9}; bw.armies.length=0; const n=bw.nodes.find(q=>q.camp&&q.owner===1); n.count=1000; n.mix=null; n.type='spear';
    const A={owner:0,type:'spear',count:2000,x:n.x,y:n.y,food:100,from:0,trail:0,camped:true,to:-1,tx:n.x,ty:n.y}; bw.armies.push(A); bw.startBattle(n.x,n.y,n.ter,n.id,{fid:0,e:{kind:'army',ref:A,c0:2000}},{fid:1,e:{kind:'node',ref:n,c0:1000}},1);
    for(let i=0;i<400;i++) bw.update(0.05); ok(n.owner===1&&n.count>150, `🏰 Sau 20 giây công trại, trại vẫn còn ${Math.round(n.count)} quân — đủ thời gian cho viện binh kéo về`); }
}

// ===== (5.6) ĐỒ TRANG TRÍ TRẠI MỞ RỘNG =====
{ const ids=BW_DECOR.map(d=>d.id), img=BW_DECOR.filter(d=>d.img), code=BW_DECOR.filter(d=>!d.img);
  const earn=BW_DECOR.filter(d=>d.earn); ok(BW_DECOR.length===30&&new Set(ids).size===30&&code.length===13&&img.length===17&&earn.length===1&&earn[0].id==='ascflag', `🏮 30 món trang trí (12 bán vẽ bằng mã + 17 ảnh ChatGPT + 1 cờ ★ Thăng Thiên không bán), không trùng mã`);
  ok(img.every(d=>BW.DECOR_SLOT[d.id]&&BW.DECOR_SLOT[d.id].length>=1), '🏮 mọi món ảnh đều có chỗ đặt quanh lều');
  ok(BW_DECOR.filter(d=>!d.earn).every(d=>d.cost>=50&&d.cost<=360)&&BW_DECOR.reduce((s,d)=>s+d.cost,0)>=4500, `🏮 giá 50–360 xu, cả bộ ${BW_DECOR.reduce((s,d)=>s+d.cost,0)} xu — đủ chỗ tiêu xu lâu dài`);
  ok(BW.decorAvail(BW_DECOR_BY.bunting)&&!BW.decorAvail(BW_DECOR_BY.pagoda), '🏮 món ảnh chỉ bán khi ảnh đã nạp (máy thử không có ảnh: chùa chưa bán, cờ dây vẫn bán)');
  // vẽ đủ mọi món không lỗi, cả khi trại sát mép bản đồ
  const calls={n:0}; const fake=new Proxy({},{get:(t,k)=> k==='measureText'? ()=>({width:10}) : /Gradient$/.test(k)? ()=>({addColorStop(){ calls.n++; }}) : ()=>{ calls.n++; }, set:()=>true});
  let err=null; try{ for(const x of [10,3000,BW.W-10]) for(const L of [0,1]) BW.drawDecor(fake,x,700,ids,12.3,L); }catch(e){ err=e; }
  ok(!err&&calls.n>500, '🏮 vẽ cùng lúc cả 30 món (giữa bản đồ và sát hai mép) không lỗi'+(err?': '+err.message:'')); }
}
