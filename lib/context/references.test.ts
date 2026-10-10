import {it,expect} from 'vitest';
import {referenceProblem} from './references';
const files={'index.html':'<p>hello</p>','app.js':'go()'};
it('allows current files and rejects stale, missing, duplicate and escaping references',()=>{
 expect(referenceProblem([{path:'app.js',versionId:'v'}],'v',files)).toBeNull();
 expect(referenceProblem([{path:'app.js',versionId:'old'}],'v',files)?.status).toBe(409);
 for(const path of ['../secret','/app.js','unknown.js','constructor'])expect(referenceProblem([{path,versionId:'v'}],'v',files)?.status).toBe(400);
 expect(referenceProblem([{path:'app.js',versionId:'v'},{path:'app.js',versionId:'v'}],'v',files)?.status).toBe(400);
});
