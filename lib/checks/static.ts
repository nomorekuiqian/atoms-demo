import type { Files } from "@/lib/agents/types";
import { MAX_FILE_BYTES } from "@/lib/agents/merge";
import { MAX_FILES } from "@/lib/agents/prompts";
import { validatePath } from "@/lib/parser/fileStreamParser";
export type CheckIssue = { path: string; message: string };
export type StaticCheck = { errors: CheckIssue[]; dependencies: string[]; unchecked: string[] };
export type CheckRecord = StaticCheck & {versionId:string; digest:string; checkedAt:string; kind:"static"};

/** Literal URL resolution only. Never fetches or executes generated content. */
export function resolveResource(from: string, ref: string): {external?:string;path?:string;error?:string} {
  const value=ref.trim();
  if(!value || value.startsWith('#') || /^(data:|blob:)/i.test(value)) return {};
  if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return {external:value};
  let clean:string;
  try {clean=decodeURIComponent(value.split(/[?#]/)[0]);}catch{return{error:"Invalid resource URL"};}
  const parts=value.startsWith('/')?[]:from.split('/').slice(0,-1);
  for(const part of clean.split('/')) {
    if(!part || part==='.')continue;
    if(part==='..'){if(!parts.length)return{error:"Resource escapes the project"};parts.pop();}
    else parts.push(part);
  }
  return {path:parts.join('/')};
}
export function checkFiles(files:Files):StaticCheck {
  const errors:CheckIssue[]=[],dependencies=new Set<string>(),unchecked=new Set<string>();
  if(!files['index.html']?.trim()) errors.push({path:'index.html',message:'Missing or empty index.html'});
  if(Object.keys(files).length>MAX_FILES) errors.push({path:'',message:`More than ${MAX_FILES} files`});
  const reference=(path:string,ref:string)=>{
    if(/var\(|\$\{|\{\{/.test(ref)){unchecked.add('Computed resource references are not checked.');return;}
    const r=resolveResource(path,ref);
    if(r.error)errors.push({path,message:`${r.error}: ${ref}`});
    if(r.external)dependencies.add(r.external);
    if(r.path && !Object.hasOwn(files,r.path))errors.push({path,message:`Missing local resource: ${r.path}`});
  };
  for(const [path,content] of Object.entries(files)) {
    const problem=validatePath(path);
    if(problem)errors.push({path,message:problem});
    if(new TextEncoder().encode(content).length>MAX_FILE_BYTES)errors.push({path,message:'File exceeds 100 KB'});
    if(/\.html$/.test(path)) {
      const html=content.replace(/<!--[\s\S]*?-->/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,tag=>tag.slice(0,tag.indexOf('>')+1));
      for(const tag of html.matchAll(/<(?:script|link|img|source|video|audio|iframe|a)\b[^>]*>/gi)) {
        for(const m of tag[0].matchAll(/\b(?:src|href|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi))reference(path,m[1]??m[2]??m[3]);
        if(/\bsrcset\s*=/i.test(tag[0]))unchecked.add('Responsive srcset resources are not checked.');
      }
    }
    if(/\.(css|html)$/.test(path)) {
      const css = path.endsWith('.css') ? content : [...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n') + [...content.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map(m=>m[1]??m[2]).join('\n');
      for(const m of css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi))reference(path,m[1]??m[2]??m[3]);
      for(const m of css.matchAll(/@import\s+["']([^"']+)["']/gi))reference(path,m[1]);
    }
    if(/\.js$/.test(path) || /<script\b/i.test(content))unchecked.add('JavaScript behavior, imports and dynamically constructed resources are not statically checked.');
  }
  if(dependencies.size)unchecked.add('External dependencies have not been fetched or verified.');
  return {errors,dependencies:[...dependencies],unchecked:[...unchecked]};
}
