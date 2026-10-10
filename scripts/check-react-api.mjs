// Authenticated generation/SSE/persistence/idempotency smoke. Creates and deletes its own QA project.
// Usage: node --env-file=.env.local scripts/check-react-api.mjs [--app URL] [--real]
import './load-project-ts.cjs';
import { createRequire } from 'node:module';
import { createClient } from '@insforge/sdk';
import { writeFile, mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { readRun } = require('../lib/sse/readRun.ts');
const { toUIMessage } = require('../lib/projects/history.ts');
const { checkFiles } = require('../lib/checks/static.ts');
const args = process.argv.slice(2), index = args.indexOf('--app');
const app = index < 0 ? 'http://localhost:3018' : args[index+1];
const real = args.includes('--real');
if (!app.startsWith('http://localhost:') && !real) throw new Error('Remote smoke requires explicit --real.');
const client = createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY });
const { data: session, error } = await client.auth.signInWithPassword({ email: process.env.QA_EMAIL || process.env.DEMO_EMAIL, password: process.env.QA_PASSWORD || process.env.DEMO_PASSWORD });
if (error) throw new Error('QA sign in failed.');
const db = client.database;
const { data: project, error: createError } = await db.from('projects').insert([{title:'ReAct SDK QA'}]).select('id').single();
if (createError) throw new Error('QA project could not be created.');
const report = { createdAt:new Date().toISOString(), app, mode:real?'real':'mock', projectId:project.id, checks:{} };
const assert = (condition, message) => { if (!condition) throw new Error(message); report.checks[message]=true; };
try {
  const body = { projectId:project.id, requestId:crypto.randomUUID(), expectedVersionId:null, prompt: real ? 'Build a compact counter with Add and Reset and localStorage persistence. Use index.html and app.js only, no CDN, under 80 lines total. Define exactly 3 behavioral acceptance criteria.' : 'Build an acceptance counter.' };
  const post = () => fetch(`${app}/api/generate`, {method:'POST',headers:{'content-type':'application/json',cookie:`insforge_access_token=${session.accessToken}`},body:JSON.stringify(body),signal:AbortSignal.timeout(280000)});
  const response = await post();
  assert(response.ok, `Generation HTTP ${response.status}`);
  const events=[];
  await readRun(response.body,e=>{events.push(e);if(e.type==='agent_start'||e.type==='agent_end'||e.type==='error')console.log(e.type,e.agent||'',e.status||e.message||'');});
  assert(!events.some(e=>e.type==='error'), 'No generation error');
  const versionEvent=events.find(e=>e.type==='version_created');
  assert(Boolean(versionEvent),'Version created');
  assert(events.some(e=>e.type==='tool_activity'),'Tool activity streamed');
  const {data:version,error:versionError}=await db.from('versions').select('id,files,acceptance').eq('id',versionEvent.versionId).single();
  assert(!versionError && version?.acceptance?.items?.length>=3,'Version contract persisted');
  assert(checkFiles(version.files).errors.length===0,'Saved snapshot static checks pass');
  const {data:messages,error:messageError}=await db.from('messages').select('id,sequence,role,content,meta').eq('project_id',project.id).order('sequence');
  assert(!messageError,'Messages readable through owner RLS');
  for(const role of ['mike','emma','bob','alex']) {
    const message=messages.find(m=>m.role===role);
    assert(message?.meta?.trace?.length>=2,`${role} independent trace persisted`);
    assert(toUIMessage({...message,version:null}).steps.length===message.meta.trace.length,`${role} trace restored for UI`);
  }
  const replay=await post();
  assert(replay.ok,'Idempotent replay HTTP success');
  const replayEvents=[];
  await readRun(replay.body,e=>replayEvents.push(e));
  assert(replayEvents.some(e=>e.type==='version_created'&&e.versionId===version.id),'Replay returns same version');
  assert(!replayEvents.some(e=>e.type==='agent_start'),'Replay does not start another agent');
  report.versionId=version.id;
  report.traces=messages.filter(m=>m.meta?.trace).map(m=>({role:m.role,trace:m.meta.trace}));
} catch(error) {
  report.error=error.message;
  process.exitCode=1;
} finally {
  const {error:deleteError}=await db.from('projects').delete().eq('id',project.id);
  report.cleanedUp=!deleteError;
  if(deleteError)process.exitCode=1;
  await mkdir('.insforge',{recursive:true});
  await writeFile(`.insforge/react-api-${real?'real':'mock'}.json`,JSON.stringify(report,null,2),{mode:0o600});
  console.log(JSON.stringify({checks:report.checks,error:report.error,cleanedUp:report.cleanedUp},null,2));
}
