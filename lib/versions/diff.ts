import type {Files} from '@/lib/agents/types';
import type {Change} from 'diff';
export type FileChange={path:string;kind:'added'|'modified'|'deleted'};
export function fileChanges(before:Files,after:Files):FileChange[] {
 return [...new Set([...Object.keys(before),...Object.keys(after)])].sort().flatMap<FileChange>(path=>{
  if(!Object.hasOwn(before,path))return[{path,kind:'added' as const}];
  if(!Object.hasOwn(after,path))return[{path,kind:'deleted' as const}];
  return before[path]===after[path]?[]:[{path,kind:'modified' as const}];
 });
}
export function lineEndings(text:string) {
 const crlf=(text.match(/\r\n/g)??[]).length,lf=(text.match(/(?<!\r)\n/g)??[]).length;
 return crlf && lf?'mixed':crlf?'CRLF':lf?'LF':'no line breaks';
}
/** Loaded only when the user expands a file, with an explicit computation budget. */
export async function textChanges(before:string,after:string):Promise<{changes:Change[];limited:boolean}> {
 const {diffLines}=await import('diff');
 return new Promise(resolve=>{
  diffLines(before,after,{timeout:150,maxEditLength:4000,callback:changes=>{
   resolve(changes?{changes,limited:false}:{changes:[{value:before,count:before.split("\n").length,removed:true,added:false},{value:after,count:after.split("\n").length,added:true,removed:false}],limited:true});
  }});
 });
}
