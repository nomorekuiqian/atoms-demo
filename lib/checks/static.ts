import type { Files } from "@/lib/agents/types";
import { MAX_FILE_BYTES } from "@/lib/agents/merge";
import { MAX_FILES } from "@/lib/agents/prompts";
import { validatePath } from "@/lib/parser/fileStreamParser";
export type CheckIssue = { path: string; message: string };
export type StaticCheck = { errors: CheckIssue[]; dependencies: string[]; unchecked: string[] };
export type CheckRecord = StaticCheck & {versionId:string; digest:string; checkedAt:string; kind:"static"};

export { resolveResource } from "@/lib/preview/resources";
import { resolveResource, RESOURCE_ATTR } from "@/lib/preview/resources";
export function checkFiles(files:Files):StaticCheck {
  const errors:CheckIssue[]=[],dependencies=new Set<string>(),unchecked=new Set<string>();
  if(!files['index.html']?.trim()) errors.push({path:'index.html',message:'Missing or empty index.html'});
  if(Object.keys(files).length>MAX_FILES) errors.push({path:'',message:`More than ${MAX_FILES} files`});
  const reference=(path:string,ref:string)=>{
    if(/var\(|\$\{|\{\{/.test(ref)){unchecked.add('Computed resource references are not checked.');return;}
    const r=resolveResource(path,ref);
    if(r.error)errors.push({path,message:`${r.error}: ${ref}`});
    if(r.external)dependencies.add(r.external);
    if(r.path?.endsWith('.html')) errors.push({path,message:'Local HTML navigation is not supported by the single-page preview. Use in-page sections.'});
    if(r.path && !Object.hasOwn(files,r.path))errors.push({path,message:`Missing local resource: ${r.path}`});
  };
  for(const [path,content] of Object.entries(files)) {
    const problem=validatePath(path);
    if(problem)errors.push({path,message:problem});
    if(new TextEncoder().encode(content).length>MAX_FILE_BYTES)errors.push({path,message:'File exceeds 100 KB'});
    if(/\.html$/.test(path)) {
      const html=content.replace(/<!--[\s\S]*?-->/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,tag=>tag.slice(0,tag.indexOf('>')+1));
      for(const tag of html.matchAll(/<(?:script|link|img|source|video|audio|iframe|a)\b[^>]*>/gi)) {
        for(const m of tag[0].matchAll(RESOURCE_ATTR))reference(path,m[2]??m[3]??m[4]);
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
