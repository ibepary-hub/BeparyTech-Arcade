(()=>{"use strict";
const c=document.getElementById('game'),x=c.getContext('2d'),D=Math.min(devicePixelRatio||1,2),E=id=>document.getElementById(id);
const start=E('start'),hud=E('hud'),controls=E('controls'),over=E('gameover'),msg=E('message');
const imgs={};['bg-race','bike','bike-left','bike-right','car-red','car-blue','car-yellow','truck','coin','ramp'].forEach(n=>{let i=new Image();i.src=n==='bg-race'?n+'.jpg':n+'.png';imgs[n]=i});
const aud={engine:new Audio('engine.wav'),coin:new Audio('coin.wav'),crash:new Audio('crash.wav'),turbo:new Audio('turbo.wav'),jump:new Audio('jump.wav'),checkpoint:new Audio('checkpoint.wav')};aud.engine.loop=true;aud.engine.volume=.22;
let W=innerWidth,H=innerHeight,playing=false,paused=false,last=0,raf=0,state;
function resize(){W=innerWidth;H=innerHeight;c.width=W*D;c.height=H*D;x.setTransform(D,0,0,D,0,0)}addEventListener('resize',resize);resize();
function reset(){state={lane:1,laneX:1,lean:0,speed:90,targetSpeed:132,turbo:0,jump:0,jumpV:0,lives:3,score:0,level:1,progress:0,roadOffset:0,traffic:[],pickups:[],ramps:[],spawnT:0,coinT:0,rampT:0,invuln:0,shake:0,combo:0,comboT:0,dragLean:0,braking:false,gas:false,curve:0,curveTarget:0,curveTimer:2,nearMiss:0,sceneryOffset:0};try{aud.engine.playbackRate=Math.max(.75,Math.min(1.65,state.speed/125))}catch{};updateHud()}
function updateHud(){E('score').textContent=Math.floor(state.score);E('lives').textContent=state.lives;E('level').textContent=state.level;E('speedNum').textContent=Math.floor(state.speed);E('progress').style.width=Math.min(100,state.progress)+'%'}
function banner(t){msg.textContent=t;msg.classList.remove('hidden');clearTimeout(banner.t);banner.t=setTimeout(()=>msg.classList.add('hidden'),1000)}
function sound(n){try{aud[n].currentTime=0;aud[n].play().catch(()=>{})}catch{}}
function refreshHome(){E('best').textContent=localStorage.motoRushBest||0;E('bestLevel').textContent=localStorage.motoRushLevel||1}refreshHome();
function startGame(){reset();start.classList.add('hidden');over.classList.add('hidden');hud.classList.remove('hidden');controls.classList.remove('hidden');playing=true;paused=false;last=performance.now();aud.engine.play().catch(()=>{});banner('🏁 VIA!');raf=requestAnimationFrame(loop)}
function gameOver(){playing=false;cancelAnimationFrame(raf);aud.engine.pause();hud.classList.add('hidden');controls.classList.add('hidden');over.classList.remove('hidden');let best=Math.max(+localStorage.motoRushBest||0,Math.floor(state.score));localStorage.motoRushBest=best;localStorage.motoRushLevel=Math.max(+localStorage.motoRushLevel||1,state.level);E('finalScore').textContent=Math.floor(state.score);E('finalLevel').textContent=state.level;E('finalBest').textContent=best;refreshHome()}
function lane(v){if(!playing||paused)return;state.lane=Math.max(0,Math.min(2,state.lane+v));state.lean=v;setTimeout(()=>state.lean=0,180)}
let swipeStart=null,swipeLast=null;
c.addEventListener('pointerdown',e=>{if(!playing||paused)return;swipeStart={x:e.clientX,y:e.clientY,t:performance.now()};swipeLast=swipeStart;c.setPointerCapture?.(e.pointerId)});
c.addEventListener('pointermove',e=>{if(!swipeStart||!playing||paused)return;swipeLast={x:e.clientX,y:e.clientY,t:performance.now()};let dx=e.clientX-swipeStart.x;state.dragLean=Math.max(-1,Math.min(1,dx/90));});
c.addEventListener('pointerup',e=>{if(!swipeStart||!playing||paused){swipeStart=null;return}let dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y,dt=performance.now()-swipeStart.t;if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*1.15&&dt<650){lane(dx>0?1:-1);try{navigator.vibrate?.(12)}catch{}}state.dragLean=0;swipeStart=null;swipeLast=null;});
c.addEventListener('pointercancel',()=>{swipeStart=null;swipeLast=null;if(state)state.dragLean=0});E('jump').onpointerdown=()=>{if(playing&&!paused&&state.jump===0){state.jumpV=620;sound('jump')}};E('turbo').onpointerdown=()=>{if(playing&&!paused&&state.turbo<=0){state.turbo=2.2;sound('turbo');banner('⚡ TURBO!')}};E('brake').onpointerdown=()=>{state.braking=true;state.targetSpeed=62};E('brake').onpointerup=E('brake').onpointercancel=()=>{state.braking=false;state.targetSpeed=132+(state.level-1)*4};
E('gas').onpointerdown=()=>{state.gas=true;state.targetSpeed=Math.min(185,148+(state.level-1)*5)};E('gas').onpointerup=E('gas').onpointercancel=()=>{state.gas=false;state.targetSpeed=132+(state.level-1)*4};
E('play').onclick=startGame;E('again').onclick=startGame;E('home').onclick=()=>{over.classList.add('hidden');start.classList.remove('hidden')};E('how').onclick=()=>E('help').classList.remove('hidden');E('closeHelp').onclick=()=>E('help').classList.add('hidden');
E('pause').onclick=()=>{if(!playing)return;paused=!paused;E('pause').textContent=paused?'▶':'Ⅱ';if(paused){aud.engine.pause();banner('PAUSA')}else{aud.engine.play().catch(()=>{});last=performance.now();raf=requestAnimationFrame(loop)}};
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')lane(-1);if(e.key==='ArrowRight')lane(1);if(e.key===' ')E('jump').onpointerdown();if(e.key==='Shift')E('turbo').onpointerdown()});
function roadAt(y){let horizon=H*.27,bottom=H*.98,t=(y-horizon)/(bottom-horizon);t=Math.max(0,Math.min(1,t));return{cx:W/2,half:W*(.13+.34*t),t}}
function lanePos(l,y){let r=roadAt(y);return r.cx+(l-1)*r.half*.62}function py(){return H*.80-state.jump*.22}
function spawnTraffic(){let types=['car-red','car-blue','car-yellow','truck'];state.traffic.push({lane:Math.floor(Math.random()*3),targetLane:null,laneX:null,y:H*.29,type:types[Math.floor(Math.random()*types.length)],spd:58+Math.random()*38,passed:false,think:.8+Math.random()*2.4});state.traffic[state.traffic.length-1].laneX=state.traffic[state.traffic.length-1].lane}
function spawnCoin(){let l=Math.floor(Math.random()*3);for(let k=0;k<4;k++)state.pickups.push({lane:l,y:H*.28-k*52,hit:false})}function spawnRamp(){state.ramps.push({lane:Math.floor(Math.random()*3),y:H*.30})}
function collide(l,y,range=48){return Math.abs(state.laneX-l)<.35&&Math.abs(py()-y)<range&&state.jump<90}
function crash(){if(state.invuln>0)return;state.lives--;state.invuln=1.55;state.shake=14;state.speed=Math.max(62,state.speed*.55);state.combo=0;sound('crash');banner('💥 ATTENTO!');if(state.lives<=0)setTimeout(gameOver,260)}
function checkpoint(){state.level++;state.progress=0;state.targetSpeed=Math.min(165,132+(state.level-1)*4);state.score+=500;sound('checkpoint');banner('🏁 CHECKPOINT '+state.level)}
function update(dt){let s=state;
s.curveTimer-=dt;if(s.curveTimer<=0){s.curveTarget=(Math.random()-.5)*1.55;s.curveTimer=3.5+Math.random()*5}
s.curve+=(s.curveTarget-s.curve)*dt*.34;s.sceneryOffset+=s.speed*dt;
if(s.turbo>0){s.turbo-=dt;s.speed+=(220-s.speed)*dt*2.7}else s.speed+=(s.targetSpeed-s.speed)*dt*1.45;s.roadOffset+=s.speed*dt;s.score+=s.speed*dt*.18*(1+s.combo*.05);s.progress+=s.speed*dt*.0105;if(s.progress>=100)checkpoint();s.laneX+=(s.lane-s.laneX)*Math.min(1,dt*8);if(s.jumpV||s.jump>0){s.jumpV-=980*dt;s.jump+=s.jumpV*dt;if(s.jump<=0){s.jump=0;s.jumpV=0}}s.invuln=Math.max(0,s.invuln-dt);s.shake=Math.max(0,s.shake-dt*25);s.comboT-=dt;if(s.comboT<=0)s.combo=0;s.spawnT-=dt;s.coinT-=dt;s.rampT-=dt;if(s.spawnT<=0){spawnTraffic();s.spawnT=Math.max(.52,1.25-s.level*.055)+Math.random()*.7}if(s.coinT<=0){spawnCoin();s.coinT=2.3+Math.random()*2}if(s.rampT<=0){spawnRamp();s.rampT=5+Math.random()*5}let move=s.speed*dt*2.8;s.traffic.forEach(o=>{o.y+=move*(1.1-o.spd/220);o.think-=dt;
if(o.think<=0&&o.y<py()-120&&Math.random()<.32){let nl=Math.max(0,Math.min(2,o.lane+(Math.random()<.5?-1:1)));o.targetLane=nl;o.think=1.2+Math.random()*2.5}
if(o.targetLane!==null){o.laneX+=(o.targetLane-o.laneX)*Math.min(1,dt*1.8);if(Math.abs(o.targetLane-o.laneX)<.03){o.lane=o.targetLane;o.laneX=o.lane;o.targetLane=null}}else o.laneX=o.lane;
if(collide(o.laneX,o.y,58))crash();
if(!o.passed&&o.y>py()+55){o.passed=true;let gap=Math.abs(s.laneX-o.laneX);if(gap<.72){s.nearMiss++;s.score+=80;s.combo++;s.comboT=2;banner('😮 PASSAGGIO RASENTE +80')}else s.score+=25}});s.traffic=s.traffic.filter(o=>o.y<H+160);s.pickups.forEach(o=>{o.y+=move;if(!o.hit&&collide(o.lane,o.y,45)){o.hit=true;s.combo++;s.comboT=2;s.score+=100*(1+s.combo*.1);sound('coin');if(s.combo>=5)banner('🔥 COMBO x'+s.combo)}});s.pickups=s.pickups.filter(o=>!o.hit&&o.y<H+80);s.ramps.forEach(o=>{o.y+=move;if(collide(o.lane,o.y,52)&&s.jump===0){s.jumpV=720;sound('jump');s.score+=150;banner('🛫 SALTO!')}});s.ramps=s.ramps.filter(o=>o.y<H+100);try{aud.engine.playbackRate=Math.max(.75,Math.min(1.65,state.speed/125))}catch{};updateHud()}
function drawRoad(){
let bg=imgs['bg-race'];if(bg.complete)x.drawImage(bg,0,0,W,H);else{x.fillStyle='#63bfea';x.fillRect(0,0,W,H)}
let horizon=H*.27,bottom=H*1.03,top=W*.13,bot=W*.48,cTop=W/2+roadCurveAt(horizon),cBot=W/2+roadCurveAt(bottom);
// grass shoulder
x.fillStyle='#2f8b43';x.fillRect(0,horizon,W,H-horizon);
// asphalt
x.fillStyle='#2d3037';x.beginPath();x.moveTo(cTop-top,horizon);x.lineTo(cTop+top,horizon);x.lineTo(cBot+bot,bottom);x.lineTo(cBot-bot,bottom);x.closePath();x.fill();
// red-white rumble strips
for(let side of [-1,1]){for(let i=0;i<18;i++){let y1=horizon+((i*55+(state.roadOffset*2.2)%55)%(bottom-horizon)),y2=y1+26,r1=roadAt(y1),r2=roadAt(y2),w1=3+16*r1.t,w2=3+16*r2.t;x.fillStyle=i%2?'#f5f5ef':'#e63735';x.beginPath();x.moveTo(r1.cx+side*r1.half,y1);x.lineTo(r1.cx+side*(r1.half+w1),y1);x.lineTo(r2.cx+side*(r2.half+w2),y2);x.lineTo(r2.cx+side*r2.half,y2);x.closePath();x.fill()}}
// lane markers
for(let ln=1;ln<3;ln++)for(let i=0;i<13;i++){let yy=horizon+((i*72+(state.roadOffset*1.95)%72)%(bottom-horizon)),r=roadAt(yy),xx=r.cx+(ln-1.5)*r.half*.62;x.strokeStyle='#f7f7f3dd';x.lineWidth=2+7*r.t;x.beginPath();x.moveTo(xx,yy);x.lineTo(xx+roadCurveAt(yy+25)-roadCurveAt(yy),yy+18+40*r.t);x.stroke()}
// roadside posts and trees
for(let i=0;i<12;i++){let yy=horizon+((i*95+(state.sceneryOffset*1.7)%95)%(bottom-horizon)),r=roadAt(yy),sc=.18+r.t*.9;for(let side of [-1,1]){let px=r.cx+side*(r.half+28+120*r.t);x.fillStyle='#f7f7f7';x.fillRect(px-2*sc,yy-24*sc,4*sc,30*sc);x.fillStyle='#d92727';x.fillRect(px-3*sc,yy-22*sc,6*sc,8*sc);if(i%3===0){x.fillStyle='#164f27';x.beginPath();x.arc(px+side*42*sc,yy-55*sc,24*sc,0,Math.PI*2);x.fill();x.fillStyle='#6d4525';x.fillRect(px+side*42*sc-3*sc,yy-40*sc,6*sc,30*sc)}}}
// speed streaks during turbo
if(state.turbo>0){x.strokeStyle='#b8f5ff66';x.lineWidth=2;for(let i=0;i<32;i++){let yy=horizon+Math.random()*(H-horizon),r=roadAt(yy),px=r.cx+(Math.random()*2-1)*r.half*1.5;x.beginPath();x.moveTo(px,yy);x.lineTo(px+(px-W/2)*.06,yy+35+Math.random()*70);x.stroke()}}
}function obj(name,l,y,bw,bh){let r=roadAt(y),sc=.25+r.t*1.1,iw=bw*sc,ih=bh*sc,xx=lanePos(l,y)-iw/2;if(imgs[name].complete)x.drawImage(imgs[name],xx,y-ih/2,iw,ih)}
function render(){x.save();if(state.shake)x.translate((Math.random()-.5)*state.shake,(Math.random()-.5)*state.shake);drawRoad();state.pickups.forEach(o=>obj('coin',o.lane,o.y,80,80));state.ramps.forEach(o=>obj('ramp',o.lane,o.y,150,100));[...state.traffic].sort((a,b)=>a.y-b.y).forEach(o=>obj(o.type,o.laneX??o.lane,o.y,150,o.type==='truck'?230:210));let yy=py(),px=lanePos(state.laneX,yy),spr=((state.lean+state.dragLean)<-.15)?imgs['bike-left']:((state.lean+state.dragLean)>.15)?imgs['bike-right']:imgs['bike'],bw=Math.min(150,W*.13),bh=bw*1.42;if(state.turbo>0){x.fillStyle='#4ed9ff99';x.beginPath();x.moveTo(px-18,yy+bh*.28);x.lineTo(px,yy+bh*.78);x.lineTo(px+18,yy+bh*.28);x.fill()}
if(state.gas&&state.turbo<=0){x.fillStyle='#ff9b3d88';x.beginPath();x.moveTo(px-8,yy+bh*.30);x.lineTo(px,yy+bh*.56);x.lineTo(px+8,yy+bh*.30);x.fill()}
if(state.braking){x.fillStyle='#ff3030aa';x.beginPath();x.arc(px,yy+bh*.20,7,0,Math.PI*2);x.fill()}if(spr.complete){x.globalAlpha=state.invuln>0&&Math.floor(state.invuln*12)%2?.4:1;x.drawImage(spr,px-bw/2,yy-bh/2,bw,bh);x.globalAlpha=1}if(state.jump>0){x.fillStyle='#0006';x.beginPath();x.ellipse(px,H*.86,bw*.42,bw*.12,0,0,Math.PI*2);x.fill()}x.restore()}
function loop(t){if(!playing||paused)return;let dt=Math.min(.035,(t-last)/1000||.016);last=t;update(dt);render();raf=requestAnimationFrame(loop)}
reset();render();
})();
