import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../app/src/main/assets/questions.js',import.meta.url),'utf8');
const {QUESTIONS,CHAPTERS}=vm.runInNewContext(source+';({QUESTIONS,CHAPTERS})');
assert.equal(QUESTIONS.length,60);
assert.equal(CHAPTERS.length,6);
assert.equal(new Set(QUESTIONS.map(q=>q.answer)).size,60,'Tekrarlanan cevap');
for(const q of QUESTIONS){assert.ok(q.clue.length>12);assert.match(q.answer,/^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZQWX]+$/u);assert.ok(q.answer.length>=3&&q.answer.length<=14);assert.ok(q.chapter>=0&&q.chapter<6);}
for(let i=0;i<6;i++)assert.equal(QUESTIONS.filter(q=>q.chapter===i).length,10);
console.log('60 soru, 6 bölüm, benzersiz cevaplar ve Türkçe harfler doğrulandı.');
