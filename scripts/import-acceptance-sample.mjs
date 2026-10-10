// Import an already generated benchmark counter into THIS run's empty smoke project.
// No model call, no quota change; the version is explicitly labelled as imported.
import {readFile,writeFile} from 'node:fs/promises';
import {createClient,createAdminClient} from '@insforge/sdk';
import assert from 'node:assert/strict';
const projectId=process.argv[2];assert(projectId&&/^[a-f0-9-]{36}$/.test(projectId));
const cfg=JSON.parse(await readFile('.insforge/project.json','utf8'));assert.equal(cfg.appkey,'53bg3mbj');
const baseUrl=process.env.NEXT_PUBLIC_INSFORGE_URL;
const client=createClient({baseUrl,anonKey:process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY});
const auth=await client.auth.signInWithPassword({email:process.env.DEMO_EMAIL,password:process.env.DEMO_PASSWORD});assert.ifError(auth.error);
const db=createAdminClient({baseUrl,apiKey:process.env.INSFORGE_API_KEY}).database;
const unwrap=r=>{assert.ifError(r.error);return r.data;};
const project=unwrap(await db.from('projects').select('id,title,current_version_id,owner_id').eq('id',projectId).single());
assert.equal(project.owner_id,auth.data.user.id);assert.equal(project.current_version_id,null);assert(project.title.startsWith('Acceptance Counter:'));
const sample=JSON.parse(await readFile('.insforge/acceptance-benchmark.json','utf8')).results.find(r=>r.taskId==='new-counter'&&r.arm==='team');
assert(sample.ok);
const version=unwrap(await db.from('versions').insert([{project_id:projectId,number:1,files:sample.files,acceptance:sample.generatedContract,summary:'Imported real-model benchmark counter; not generated in this workspace'}]).select('id').single());
unwrap(await db.from('projects').update({current_version_id:version.id,title:'Acceptance Counter — benchmark sample'}).eq('id',projectId).is('current_version_id',null));
await writeFile('.insforge/production-acceptance-sample.json',JSON.stringify({projectId,versionId:version.id,sourceTask:'new-counter',sourceArm:'team'}),{mode:0o600});
console.log('Imported labelled sample',projectId,version.id);
