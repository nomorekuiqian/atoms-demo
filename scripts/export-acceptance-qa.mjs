// Preserve only this run's acceptance fixtures/evidence before retiring its branch.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createAdminClient} from '@insforge/sdk';
import assert from 'node:assert/strict';
const cfg=JSON.parse(await readFile('.insforge/acceptance-branch.json','utf8'));assert(cfg.appkey.includes('-'));
const qa=JSON.parse(await readFile('.insforge/acceptance-qa.json','utf8'));
const db=createAdminClient({baseUrl:`https://${cfg.appkey}.${cfg.region}.insforge.app`,apiKey:cfg.api_key}).database;
const unwrap=r=>{assert.ifError(r.error);return r.data;};
const versions=unwrap(await db.from('versions').select('id,number,files,acceptance,parent_version_id,summary').eq('project_id',qa.projectId).gte('number',105).order('number'));
const observations=unwrap(await db.from('acceptance_observations').select('id,version_id,criterion_id,digest,kind,status,evidence,created_at,sequence').in('version_id',versions.map(v=>v.id)).order('sequence'));
await mkdir('benchmarks/results/2026-10-10',{recursive:true});
await writeFile('benchmarks/results/2026-10-10/regression-chain.json',JSON.stringify({scope:'Synthetic baseline, deliberate synthetic regression, real-model repair; isolated backend browser observations',versions,observations},null,2));
console.log('Exported',versions.length,'versions and',observations.length,'observations; no auth data');
