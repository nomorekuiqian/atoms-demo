import {it,expect} from 'vitest';import {unzipSync,strFromU8} from 'fflate';import {sourceArchive,archiveFilename} from './archive';
const version={id:'test',number:2};
it('exports exact source bytes, empty files, and collision-safe instructions',()=>{
 const files={'index.html':'<h1>你好</h1>\r\n','empty.txt':'','ATOMS-README.md':'original','atoms-readme-1.md':'also original'};
 const out=unzipSync(sourceArchive(files,version));for(const [path,text]of Object.entries(files))expect(strFromU8(out[path])).toBe(text);
 expect(strFromU8(out['ATOMS-README-2.md'])).toContain('python3 -m http.server');expect(strFromU8(out['index.html'])).not.toContain('data-atoms-preview');
});
it('rejects traversal, absolute paths, backslashes, oversized files, and unsafe names',()=>{
 for(const path of ['../x.js','/x.js','a/../../x.js','a\\x.js','__proto__','a%2fx.js'])expect(()=>sourceArchive({[path]:'x'},version)).toThrow();
 expect(()=>sourceArchive({'a.txt':'x'.repeat(100001)},version)).toThrow();
 expect(archiveFilename('中文 / "\r\n title',2)).toBe('title-v2.zip');
});
