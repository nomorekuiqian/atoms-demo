// Local-only test server against the isolated backend; no credentials printed.
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const cfg=JSON.parse(await readFile('.insforge/acceptance-branch.json','utf8'));
const qa=JSON.parse(await readFile('.insforge/acceptance-qa.json','utf8'));
const anon=JSON.parse(await readFile('.insforge/branch-anon.json','utf8')).value;
if(!cfg.appkey.includes('-') || !anon)throw new Error('Missing isolated branch configuration');
const proc=spawn('npm',['run','dev','--','--port','3015'],{stdio:'inherit',env:{...process.env,NEXT_DIST_DIR:'.next-dev',NEXT_PUBLIC_INSFORGE_URL:`https://${cfg.appkey}.${cfg.region}.insforge.app`,NEXT_PUBLIC_INSFORGE_ANON_KEY:anon,INSFORGE_API_KEY:cfg.api_key,DEMO_EMAIL:qa.email,DEMO_PASSWORD:qa.password,LLM_MOCK:'1'}});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>proc.kill(signal));
proc.on('exit',code=>process.exit(code??1));
