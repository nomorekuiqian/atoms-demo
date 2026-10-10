import {it,expect} from 'vitest';
import {fileChanges,lineEndings,textChanges} from './diff';
it('compares presence independently from empty content',()=>{
 expect(fileChanges({}, {'empty.txt':''})).toEqual([{path:'empty.txt',kind:'added'}]);
 expect(fileChanges({'empty.txt':''},{})).toEqual([{path:'empty.txt',kind:'deleted'}]);
 expect(fileChanges({'a.txt':'old','same.txt':'x'},{'a.txt':'new','same.txt':'x','new.txt':''})).toEqual([{path:'a.txt',kind:'modified'},{path:'new.txt',kind:'added'}]);
});
it('preserves exact before and after text, including newline changes',async()=>{
 const before='one\r\ntwo\r\n',after='one\nthree\n';const {changes}=await textChanges(before,after);
 expect(changes.filter(c=>!c.added).map(c=>c.value).join('')).toBe(before);
 expect(changes.filter(c=>!c.removed).map(c=>c.value).join('')).toBe(after);
 expect(lineEndings(before)).toBe('CRLF');expect(lineEndings(after)).toBe('LF');
});
it('handles first versions, unchanged snapshots and long text',async()=>{
 expect(fileChanges({}, {'index.html':'x','app.js':'y'}).every(c=>c.kind==='added')).toBe(true);
 expect(fileChanges({'index.html':'x'},{'index.html':'x'})).toEqual([]);
 const old='x\n'.repeat(20000),next='y\n'.repeat(20000);const result=await textChanges(old,next);
 expect(result.changes.filter(c=>!c.removed).map(c=>c.value).join('')).toBe(next);
});
