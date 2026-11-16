import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const asset=new URL('../app/src/main/assets/',import.meta.url);
const questions=fs.readFileSync(new URL('questions.js',asset),'utf8');
const mechanics=fs.readFileSync(new URL('mechanics.js',asset),'utf8');
const game=fs.readFileSync(new URL('game.js',asset),'utf8');
function start(saved){
 const elements=new Map(),timers=new Map(),rafs=new Map();let serial=0,clock=0;
 const drawing=new Proxy({createLinearGradient(){return {addColorStop(){}};}},{get(target,key){return target[key]||(()=>{});}});
 class Element {
  children=[];style={setProperty(key,value){this[key]=value;}};dataset={};className='';open=false;clientWidth=360;clientHeight=400;complete=true;naturalWidth=863;
  classList={add(){},remove(){},toggle(){}};
  set textContent(value){this.text=String(value);this.children=[];}
  get textContent(){return (this.text||'')+this.children.map(c=>c.textContent).join('');}
  append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}
  setAttribute(){}addEventListener(){}showModal(){this.open=true;}close(){this.open=false;}getContext(){return drawing;}
 }
 const document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement(){return new Element();},body:new Element(),addEventListener(){},querySelector(){return new Element();},querySelectorAll(){return [];}};
 class Audio extends Element {paused=true;ended=false;load(){}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}}
 const context={document,Audio,navigator:{},window:{addEventListener(){}},localStorage:{getItem(){return saved?JSON.stringify(saved):null;},setItem(){}},requestAnimationFrame(fn){rafs.set(++serial,fn);return serial;},cancelAnimationFrame(id){rafs.delete(id);},setTimeout(fn,ms){timers.set(++serial,{fn,ms,at:clock+ms});return serial;},clearTimeout(id){timers.delete(id);}};
 const api=vm.runInNewContext(questions+'\n'+mechanics+'\n'+game+'\n;({type,check,hint,erase,typebarGeometry,keys:TYPEWRITER_KEYS,read:()=>JSON.parse(JSON.stringify(state)),answer:()=>q().answer})',context);
 function advance(ms){const until=clock+ms;while(clock<until){clock+=Math.min(10,until-clock);const frames=[...rafs.values()];rafs.clear();for(const fn of frames)fn(clock);for(const [id,t] of [...timers])if(t.at<=clock&&timers.delete(id))t.fn();}}
 return {api,elements,advance,flush(){let count=0;while(rafs.size||timers.size){assert.ok(count++<5000,'Mechanical queue did not settle');advance(10);}},pending:()=>[...timers.values()].filter(t=>t.ms===850).length};
}
const a=start();
// The key moves before ink appears; the letter is committed at impact, not on touch.
a.api.type('A');a.advance(60);assert.equal(a.api.read().entries[0].join(''),'');a.advance(40);assert.equal(a.api.read().entries[0].join(''),'A');a.advance(100);
for(const c of 'NKARA')a.api.type(c);a.advance(1000);
assert.equal(a.api.read().current,0);assert.equal(a.api.read().score,100);assert.equal(a.pending(),1);
a.api.check();assert.equal(a.api.read().score,100);a.flush();assert.equal(a.api.read().current,1);
for(const c of 'AA')a.api.type(c);a.flush();assert.equal(a.pending(),0);assert.equal(a.api.read().current,1);
a.elements.get('slots').children[1].onclick();a.api.type('Y');a.flush();assert.equal(a.api.read().score,200);assert.equal(a.api.read().current,2);
const b=start({version:1,contentVersion:2,current:2,entries:{2:['D','A','K','İ','K','']},solved:[],locks:{},score:0,hints:2,sound:false});
b.api.hint();b.flush();assert.equal(b.api.read().score,85);assert.equal(b.api.read().current,3);
const c=start({version:1,contentVersion:2,current:119,solved:Array.from({length:119},(_,i)=>i),entries:{},locks:{},score:0,hints:10,sound:false});
for(const letter of c.api.answer())c.api.type(letter);c.flush();assert.equal(c.api.read().current,119);assert.equal(c.elements.get('dialog').open,true);
const pivots=a.api.keys.map(k=>a.api.typebarGeometry(k.letter));
assert.equal(new Set(pivots.map(g=>`${g.pivot.x},${g.pivot.y}`)).size,32,'Each letter must have its own typebar pivot');
assert.equal(new Set(pivots.map(g=>`${g.strike.x},${g.strike.y}`)).size,1,'All bars must hit the same physical print point');
const back=start();back.api.type('A');back.flush();assert.equal(back.elements.get('mechanicsCanvas').dataset.column,'1');back.api.erase();back.flush();assert.equal(back.api.read().entries[0].join(''),'');assert.equal(back.elements.get('mechanicsCanvas').dataset.column,'0');
console.log('32 independent typebars, impact timing, carriage return, backspace, queued input and auto advance passed.');
