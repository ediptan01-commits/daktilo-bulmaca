'use strict';
// All coordinates are in the approved photograph's original 863 × 1823 space.
const KEY_ROWS=['QWERTYUIOPĞÜ','ASDFGHJKLŞİ','ZXCVBNMÖÇ'];
const KEYBOARD_SCALE_Y=385/345;
const TYPEWRITER_KEYS=[
 ...[...'QWERTYUIOPĞÜ'].map((letter,i)=>({letter,x:[66,141.5,211.5,276.5,346.5,413,481.5,549.5,615,680.5,748,812][i],y:1130})),
 ...[...'ASDFGHJKLŞİ'].map((letter,i)=>({letter,x:[84.5,159.5,233.5,307.5,380.5,452,520.5,591.5,662,734,802.5][i],y:1243})),
 ...[...'ZXCVBNMÖÇ'].map((letter,i)=>({letter,x:[114,196.5,279,360.5,442,524.5,607,686.5,769][i],y:1351}))
].map(key=>({...key,sourceY:key.y,y:1055+(key.y-1070)*KEYBOARD_SCALE_Y}));
const TYPEWRITER_STRIKE={x:431.5,y:768};
function typebarGeometry(letter){
 const key=TYPEWRITER_KEYS.find(k=>k.letter===letter);if(!key)return null;
 // Links from the keys fan out to separate pivots along the type basket.
 const ordered=[...TYPEWRITER_KEYS].sort((a,b)=>a.x-b.x||a.y-b.y),index=ordered.indexOf(key);
 const angle=-1.18+index/(ordered.length-1)*2.36;
 return {pivot:{x:431.5+216*Math.sin(angle),y:849+119*Math.cos(angle)},strike:{...TYPEWRITER_STRIKE},key};
}
class TypewriterMechanism {
 constructor(canvas,image,paper){
  this.canvas=canvas;this.image=image;this.paper=paper;this.ctx=canvas.getContext('2d');
  canvas.width=863;canvas.height=955;this.queue=[];this.active=null;this.column=0;this.limit=1;this.feed=0;this.spool=0;this.raf=null;
  this.draw();if(!image.complete)image.addEventListener('load',()=>this.draw());
 }
 setColumn(column,limit){this.column=Math.max(0,column);this.limit=Math.max(1,limit);this.canvas.dataset.column=String(this.column);this.syncPaper();this.draw();}
 carriageOffset(){const scale=this.canvas.clientWidth/863||.4;return -Math.min(this.column*1.25,7/scale);}
 syncPaper(){if(this.paper)this.paper.style.setProperty('--carriage-offset',(this.carriageOffset()*(this.canvas.clientWidth/863||.4))+'px');}
 isWorking(){return !!this.active||this.queue.length>0;}
 clearQueued(){this.queue=[];}
 enqueue(job){this.queue.push(job);this.startNext();}
 startNext(){if(this.active||!this.queue.length)return;this.active={...this.queue.shift(),started:null,hit:false};this.canvas.dataset.lastKey=this.active.letter||'RETURN';const g=typebarGeometry(this.active.letter);if(g){this.canvas.dataset.pivotX=String(g.pivot.x);this.canvas.dataset.pivotY=String(g.pivot.y);}this.active.onStart?.();this.raf=requestAnimationFrame(t=>this.frame(t));}
 frame(t){const a=this.active;if(!a)return;if(a.started===null)a.started=t;const elapsed=t-a.started;
  a.progress=Math.min(1,elapsed/(a.kind==='return'?780:170));
  if(!a.hit&&elapsed>=(a.kind==='return'?210:65)){a.hit=true;if(a.kind==='return'){this.column=0;this.feed=(this.feed+1)%3;}else if(a.kind==='key'){this.spool+=.008;}this.canvas.dataset.impacts=String((Number(this.canvas.dataset.impacts)||0)+1);a.onImpact?.();this.syncPaper();}
  a.onProgress?.(a.progress);this.draw();
  if(a.progress>=1){this.active=null;a.onDone?.();this.draw();this.startNext();}else this.raf=requestAnimationFrame(next=>this.frame(next));
 }
 returnCarriage(onImpact,onDone,onProgress){this.clearQueued();this.enqueue({kind:'return',onImpact,onDone,onProgress});}
 depressedPatch(key,depth){
  const c=this.ctx,x=key.x,y=key.y-670;
  c.save();c.beginPath();c.ellipse(x,y+7,35,49,0,0,Math.PI*2);c.clip();
  c.fillStyle='#15190f';c.fillRect(x-36,y-46,72,102);
  c.drawImage(this.image,x-35,key.sourceY-38,70,88,x-35,y-42+depth,70,88*KEYBOARD_SCALE_Y);c.restore();
 }
 drawKeyboard(){
  const c=this.ctx;
  // Magnify only the original photographed keyboard, keeping its brass, shadows and rods.
  c.save();c.beginPath();c.roundRect(27,385,815,385,24);c.clip();
  c.drawImage(this.image,27,1070,815,345,27,385,815,385);
  const a=this.active,p=a?.progress||0;
  const key=a?.kind==='key'?TYPEWRITER_KEYS.find(k=>k.letter===a.letter):null;
  const depth=key?Math.max(0,(p<.38?p/.38:(1-p)/.62)*6):0;
  if(key)this.depressedPatch(key,depth);
  for(const k of TYPEWRITER_KEYS){
   const y=k.y-670+(k===key?depth:0);
   // Enlarge the actual printed letter; retain the original face texture and font.
   c.save();c.beginPath();c.ellipse(k.x,y-3,26,30,0,0,Math.PI*2);c.clip();
   c.drawImage(this.image,k.x-24,k.sourceY-30,48,60,k.x-29,y-35,58,67);c.restore();
  }
  c.restore();
 }

 draw(){const c=this.ctx;c.clearRect(0,0,863,955);if(!this.image.complete||!this.image.naturalWidth)return;
  const a=this.active,p=a?.progress||0,returning=a?.kind==='return';
  const carriage=this.carriageOffset()*(returning?1-Math.min(1,p*2):1);
  // The roller is a photographic patch; the stationary body and print guide never move.
  c.fillStyle='#0c1710';c.fillRect(0,0,863,62);
  c.drawImage(this.image,0,670,863,62,carriage,0,863,62);
  if(this.spool){for(const [x,y] of [[163,819],[696,820]]){c.save();c.translate(x,y-670);c.scale(1,.49);c.beginPath();c.arc(0,0,69,0,Math.PI*2);c.clip();c.rotate(this.spool);c.drawImage(this.image,x-69,y-34,138,68,-69,-69,138,138);c.restore();}}
  this.drawKeyboard();
  if(!a)return;
  if(returning){
   // Feed roller and return lever move together on a new line.
   const lift=Math.sin(p*Math.PI)*4;c.save();c.globalAlpha=.9;c.drawImage(this.image,17,728,75,211,17-lift,58,75,211);c.restore();return;
  }
  const key=TYPEWRITER_KEYS.find(k=>k.letter===a.letter);
  const depth=(p<.38?p/.38:(1-p)/.62)*5;

  if(a.kind==='erase'){c.save();c.globalAlpha=.15;c.fillStyle='#000';c.fillRect(686,770,118,79);c.restore();return;}
  if(a.kind!=='key'||!key)return;
  const g=typebarGeometry(a.letter),rise=p<=.39?Math.sin(p/.39*Math.PI/2):Math.cos((p-.39)/.61*Math.PI/2);
  const length=.07+.93*Math.max(0,rise),end={x:g.pivot.x+(g.strike.x-g.pivot.x)*length,y:g.pivot.y+(g.strike.y-g.pivot.y)*length};
  c.save();c.lineCap='round';c.beginPath();c.moveTo(g.pivot.x,g.pivot.y-670);c.lineTo(end.x,end.y-670);c.strokeStyle='#13150d';c.lineWidth=8;c.stroke();
  const metal=c.createLinearGradient(g.pivot.x-3,0,g.pivot.x+3,0);metal.addColorStop(0,'#675333');metal.addColorStop(.45,'#f2dc9e');metal.addColorStop(1,'#7b6844');c.strokeStyle=metal;c.lineWidth=4;c.stroke();
  c.translate(end.x,end.y-670);c.rotate(Math.atan2(end.x-g.pivot.x,g.pivot.y-end.y));c.fillStyle='#cfb681';c.fillRect(-5,-9,10,12);c.fillStyle='#423c2c';c.fillRect(-4,-8,8,3);c.restore();
 }
}
