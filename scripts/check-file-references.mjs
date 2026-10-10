import {createClient} from '@insforge/sdk';
import {readFile} from 'node:fs/promises';import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const app=process.env.APP_URL??'http://localhost:3300';
const qa=JSON.parse(await readFile(process.env.QA_SESSION_FILE ?? '.insforge/qa-enhancements.json'));
const client=createClient({baseUrl:process.env.NEXT_PUBLIC_INSFORGE_URL,anonKey:process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY});
const checked=r=>{if(r.error)throw new Error(r.error.message);return r.data;};
const login=checked(await client.auth.signInWithPassword({email:qa.email,password:qa.password}));const db=client.database;
const project=checked(await db.from('projects').insert([{title:'File reference acceptance'}]).select('id').single());
const fixture=JSON.parse(await readFile('fixtures/new-pomodoro.json'));
const files=Object.fromEntries([...fixture.alex.matchAll(/<file path="([^"]+)">([\s\S]*?)<\/file>/g)].map(m=>[m[1],m[2].replace(/^\n/,'').replace(/\n$/,'')]));
const v1=checked(await db.from('versions').insert([{project_id:project.id,number:1,files,summary:'Reference fixture'}]).select('id').single());checked(await db.from('projects').update({current_version_id:v1.id}).eq('id',project.id));
const browser=await chromium.launch({channel:'chrome',headless:true});const c=await browser.newContext({viewport:{width:1280,height:900}});await c.addCookies([{name:'insforge_access_token',value:login.accessToken,domain:new URL(app).hostname,path:'/'}]);const p=await c.newPage();let bodies=[],fail=true;
try{
await p.goto(`${app}/project/${project.id}`);await p.getByRole('tab',{name:'Code',exact:true}).click();
const choose=async name=>{const picker=p.getByRole('combobox',{name:'File',exact:true});if(await picker.isVisible())await picker.selectOption(name);else await p.getByRole('navigation',{name:'Files',exact:true}).getByRole('button',{name,exact:true}).click();};
await choose('app.js');await p.getByRole('button',{name:'Add file to chat',exact:true}).click();await choose('styles.css');await p.getByRole('button',{name:'Add file to chat',exact:true}).click();await p.getByRole('button',{name:'Remove app.js reference',exact:true}).click();
assert.equal(await p.getByRole('button',{name:'Remove styles.css reference',exact:true}).count(),1);
await p.route('**/api/generate',async r=>{bodies.push(r.request().postDataJSON());if(fail){fail=false;await r.abort('internetdisconnected');}else await r.continue();});
await p.getByRole('textbox').fill('Make the app dark. Keep all timer behavior.');await p.getByRole('button',{name:'Send',exact:true}).click();await p.getByRole('button',{name:'Try again',exact:true}).click();await p.getByRole('button',{name:'Stop',exact:true}).waitFor({state:'hidden',timeout:180000});
assert.deepEqual(bodies[0].references,[{path:'styles.css',versionId:v1.id}]);assert.deepEqual(bodies[1].references,bodies[0].references);assert.equal(bodies[0].requestId,bodies[1].requestId);
const current=checked(await db.from('projects').select('current_version_id').eq('id',project.id).single()).current_version_id;assert.notEqual(current,v1.id);
const msgs=checked(await db.from('messages').select('role,meta').eq('project_id',project.id));const users=msgs.filter(m=>m.role==='user');assert.equal(users.length,1);assert.deepEqual(users[0].meta.references,bodies[0].references);
await p.reload();await p.getByText('styles.css · v1',{exact:true}).waitFor();console.log('PASS add/remove refs, identical retry request, one saved message and reference history after reload');
const post=async body=>p.evaluate(async body=>{const r=await fetch('/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return{status:r.status,type:r.headers.get('content-type')};},body);
for(const [references,expected] of [[[{path:'styles.css',versionId:v1.id}],409],[[{path:'../secret',versionId:current}],400],[[{path:'missing.js',versionId:current}],400]]){
 const result=await post({projectId:project.id,requestId:randomUUID(),expectedVersionId:current,prompt:'Update file',references});assert.equal(result.status,expected);assert(result.type.includes('application/json'));
}
console.log('PASS stale, traversing and nonexistent references rejected before streaming');
const other=createClient({baseUrl:process.env.NEXT_PUBLIC_INSFORGE_URL,anonKey:process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY});checked(await other.auth.signUp({email:`refs-other-${Date.now()}@example.com`,password:`QA-${randomUUID()}!`}));const owned=checked(await other.database.from('projects').insert([{title:'Other owner ref fixture'}]).select('id').single());
try{const result=await post({projectId:owned.id,requestId:randomUUID(),expectedVersionId:null,prompt:'Update',references:[]});assert.equal(result.status,404);console.log('PASS another owner project cannot be referenced or generated');}finally{checked(await other.database.from('projects').delete().eq('id',owned.id));}
await p.screenshot({path:'/tmp/atoms-file-references.png'});
}finally{await browser.close();checked(await db.from('projects').delete().eq('id',project.id));}
