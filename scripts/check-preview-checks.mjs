// Browser regression against private, synthetic snapshots. Requires Playwright + Chrome.
import {createClient} from '@insforge/sdk';
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const app=process.env.APP_URL ?? 'http://localhost:3300';
const qa=JSON.parse(await readFile(process.env.QA_SESSION_FILE ?? '.insforge/qa-enhancements.json'));
if(qa.email && qa.password) {
 const authClient=createClient({baseUrl:process.env.NEXT_PUBLIC_INSFORGE_URL,anonKey:process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY});
 const login=await authClient.auth.signInWithPassword({email:qa.email,password:qa.password});
 if(login.error)throw new Error(login.error.message);qa.token=login.data.accessToken;
}
const client=createClient({baseUrl:process.env.NEXT_PUBLIC_INSFORGE_URL,anonKey:process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,accessToken:qa.token});
const db=client.database;const checked=r=>{if(r.error)throw new Error(r.error.message);return r.data;};
const project=checked(await db.from('projects').insert([{title:'M9 checks acceptance'}]).select('id').single());
const browser=await chromium.launch({channel:'chrome',headless:true});const c=await browser.newContext({viewport:{width:1280,height:900}});await c.addCookies([{name:'insforge_access_token',value:qa.token,domain:new URL(app).hostname,path:'/'}]);
await c.addInitScript(()=>{window.addEventListener('message',e=>{if(window===window.top && location.search.includes('dropReady=1') && e.data?.source==='atoms-preview' && e.data.type==='ready')e.stopImmediatePropagation();},true);});
const p=await c.newPage();
let number=0;
try{
for(const [name,files,status] of [
 ['complete',{'index.html':'<!doctype html><html><head></head><body><button>Works</button></body></html>'},'No errors received during observation'],
 ['missing',{'index.html':'<html><head><script src="missing.js"></script></head><body>Missing resource</body></html>'},'static issue'],
 ['syntax',{'index.html':'<html><head><script>function broken(</script></head><body>Syntax fixture</body></html>'},'Runtime errors received'],
 ['runtime',{'index.html':'<html><head><script>setTimeout(function(){throw new Error("M9 runtime fixture")},4500)</script></head><body>Runtime fixture</body></html>'},'Runtime errors received'],
 ['timeout',{'index.html':'<html><head></head><body>Startup-signal loss fixture</body></html>'},'Startup not received within 10 seconds'],
]){
 const v=checked(await db.from('versions').insert([{project_id:project.id,number:++number,files,summary:name}]).select('id').single());
 checked(await db.from('projects').update({current_version_id:v.id}).eq('id',project.id));
 await p.goto(`${app}/project/${project.id}${name==='timeout'?'?dropReady=1':''}`,{waitUntil:'domcontentloaded'});
 await p.locator('summary').filter({hasText:status}).waitFor({timeout:25000});
 const report=await p.evaluate(async ids=>{const r=await fetch(`/api/projects/${ids.p}/versions/${ids.v}`);return r.json();},{p:project.id,v:v.id});
 assert.equal(report.checks.versionId,v.id);assert.equal(report.checks.digest.length,64);
 if(name==='missing'){
  const publish=await p.evaluate(async ids=>{const r=await fetch(`/api/projects/${ids.p}/publish`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({versionId:ids.v,slug:'m9-invalid-test'})});return r.status},{p:project.id,v:v.id});assert.equal(publish,422);
 }
 if(name==='complete'){
  const stale=await p.evaluate(async ids=>{const r=await fetch(`/api/projects/${ids.p}/publish`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({versionId:crypto.randomUUID(),slug:'m9-stale-test'})});return r.status},{p:project.id});assert.equal(stale,409);
 }
 await p.screenshot({path:`/tmp/atoms-m9-${name}.png`});
 console.log('PASS',name,'version-bound checks and preview observation');
}
await p.screenshot({path:'/tmp/atoms-m9-timeout.png'});
}finally{await browser.close();checked(await db.from('projects').delete().eq('id',project.id));}
