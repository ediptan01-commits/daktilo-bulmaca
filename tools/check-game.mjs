import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const asset=new URL('../app/src/main/assets/',import.meta.url);
const questions=fs.readFileSync(new URL('questions.js',asset),'utf8');
const game=fs.readFileSync(new URL('game.js',asset),'utf8');
function start(saved){
 const elements=new Map(),timers=new Map();let serial=0;
 class Element {
  children=[];style={};dataset={};className='';open=false;clientWidth=360;clientHeight=400;
  classList={add(){},remove(){},toggle(){}};
  set textContent(value){this.text=String(value);this.children=[];}
  get textContent(){return (this.text||'')+this.children.map(c=>c.textContent).join('');}
  append(...items){this.children.push(...items);} replaceChildren(...items){this.children=items;}
  setAttribute(){} addEventListener(){} showModal(){this.open=true;} close(){this.open=false;}
 }
 const document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement(){return new Element();},body:new Element(),addEventListener(){},querySelectorAll(){return [...elements.values()].flatMap(el=>el.children.flatMap(row=>row.children)).filter(el=>el.className==='key');}};
 class Audio extends Element {paused=true;ended=false;load(){}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}}
 const context={document,Audio,navigator:{},window:{addEventListener(){}},localStorage:{getItem(){return saved?JSON.stringify(saved):null;},setItem(){}},setTimeout(fn,ms){timers.set(++serial,{fn,ms});return serial;},clearTimeout(id){timers.delete(id);}};
 const api=vm.runInNewContext(questions+'\n'+game+'\n;({type,check,hint,read:()=>JSON.parse(JSON.stringify(state)),answer:()=>q().answer})',context);
 return {api,elements,flush(){for(const [id,t] of [...timers.entries()].sort((a,b)=>a[1].ms-b[1].ms)){if(timers.delete(id))t.fn();}},pending:()=>[...timers.values()].filter(t=>t.ms===850).length};
}
// A correct answer awards once and automatically advances after the feedback interval.
const a=start();for(const c of 'ANKARA')a.api.type(c);
assert.equal(a.api.read().current,0);assert.equal(a.api.read().score,100);assert.equal(a.pending(),1);
a.api.check();assert.equal(a.api.read().score,100,'Repeated enter must not award twice');
a.flush();assert.equal(a.api.read().current,1,'Correct answer must advance without another click');
// Incorrect answers stay put; correcting a selected letter can then trigger the same transition.
for(const c of 'AA')a.api.type(c);assert.equal(a.pending(),0);assert.equal(a.api.read().current,1);
a.elements.get('slots').children[1].onclick();a.api.type('Y');
assert.equal(a.api.read().score,200);a.flush();assert.equal(a.api.read().current,2);
// A hint that completes the word must also advance, retaining its point deduction.
const b=start({version:1,contentVersion:2,current:2,entries:{2:['D','A','K','İ','K','']},solved:[],locks:{},score:0,hints:2,sound:false});
b.api.hint();assert.equal(b.api.read().score,85);b.flush();assert.equal(b.api.read().current,3);
// The last answer opens completion instead of wrapping to an already solved question.
const c=start({version:1,contentVersion:2,current:119,solved:Array.from({length:119},(_,i)=>i),entries:{},locks:{},score:0,hints:10,sound:false});
for(const letter of c.api.answer())c.api.type(letter);c.flush();assert.equal(c.api.read().current,119);assert.equal(c.elements.get('dialog').open,true);
console.log('Automatic advance, incorrect correction, hint completion and final completion passed.');
