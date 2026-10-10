import {zipSync,strToU8} from 'fflate';
import type {Files} from '@/lib/agents/types';
import {validatePath} from '@/lib/parser/fileStreamParser';
/** Raw immutable files only. Never call the preview builder in this module. */
export function sourceArchive(files:Files,version:{id:string;number:number}):Uint8Array {
 const entries=Object.entries(files);
 if(entries.length>6 || entries.some(([path,content])=>validatePath(path) || typeof content!=='string' || strToU8(content).length>100000))throw new Error('This snapshot contains an unsafe path or exceeds the export limits.');
 const archive:Record<string,Uint8Array>=Object.create(null);
 for(const [path,content] of entries)archive[path]=strToU8(content);
 let readme='ATOMS-README.md',n=1;
 // Case-insensitive collision safety also protects extraction on macOS/Windows.
 const lower=new Set(entries.map(([p])=>p.toLowerCase()));
 while(lower.has(readme.toLowerCase()))readme=`ATOMS-README-${n++}.md`;
 archive[readme]=strToU8(`# Atoms Lite source export\n\nVersion ${version.number} (${version.id}). Original snapshot files, unchanged.\n\n## Run locally\n\nUnzip into a new folder. From that folder run \`python3 -m http.server 8080\`, then open http://localhost:8080. Stop with Ctrl+C. Use an HTTP server, not file://, for relative requests and modules. Review generated code before running it.\n\n## Boundaries\n\nExternal fonts, scripts, images or APIs still require their original network services; this ZIP does not bundle or license external assets. It does not include platform credentials, chat history, accounts, database data or preview instrumentation. Generated source itself is preserved exactly; review any values you asked the model to put in it.\n\nThe hosted sandbox uses an isolated storage bridge. Exported code uses normal browser localStorage for its local origin; existing hosted data is not transferred. Runtime diagnostics and element selection belong to the workspace and are not included.\n`);
 return zipSync(archive,{level:6});
}
export function archiveFilename(title:string,number:number) {
 const safe=title.toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'app';
 return `${safe}-v${number}.zip`;
}
