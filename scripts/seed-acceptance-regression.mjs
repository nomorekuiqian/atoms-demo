// Deliberate regression in the isolated QA project. Never targets production.
import {readFile,writeFile} from 'node:fs/promises';
import {createAdminClient} from '@insforge/sdk';
import assert from 'node:assert/strict';
const cfg=JSON.parse(await readFile('.insforge/acceptance-branch.json','utf8'));
assert(cfg.appkey.includes('-'));
const qa=JSON.parse(await readFile('.insforge/acceptance-qa.json','utf8'));
const db=createAdminClient({baseUrl:`https://${cfg.appkey}.${cfg.region}.insforge.app`,apiKey:cfg.api_key}).database;
const unwrap=r=>{assert.ifError(r.error);return r.data;};
const previous=unwrap(await db.from('versions').select('*').eq('id',qa.versionId).single());
const observations=unwrap(await db.from('acceptance_observations').select('status').eq('version_id',previous.id).eq('kind','automatic'));
assert(observations.length>=3 && observations.every(o=>o.status==='passed'));
const files={...previous.files,'app.js':'// Deliberate fixture regression: controls still exist, their behavior was removed.'};
const next=unwrap(await db.from('versions').insert([{project_id:qa.projectId,number:previous.number+1,files,acceptance:previous.acceptance,parent_version_id:previous.id,summary:'Synthetic regression: inert controls'}]).select('id').single());
unwrap(await db.from('projects').update({current_version_id:next.id}).eq('id',qa.projectId));
await writeFile('.insforge/acceptance-regression.json',JSON.stringify({projectId:qa.projectId,baseline:previous.id,candidate:next.id}),{mode:0o600});
console.log('Seeded inert candidate',next.id);
