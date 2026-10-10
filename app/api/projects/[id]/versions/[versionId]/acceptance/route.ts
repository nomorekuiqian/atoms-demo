import {isDeepStrictEqual} from "node:util";
import {z} from 'zod';
import {insforgeServer} from '@/lib/insforge/server';
import {insforgeAdmin} from '@/lib/insforge/admin';
import {checkVersion} from '@/lib/checks/server';
import {readContract} from '@/lib/acceptance/contract';
import {observationInput,observationProblem} from '@/lib/acceptance/evidence';
import type {Files} from '@/lib/agents/types';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string;versionId:string}>};
async function snapshot(context:Context){
 const {id,versionId}=await context.params;
 if(!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(versionId).success)return {error:Response.json({error:'Invalid version.'},{status:400})};
 const client=await insforgeServer();const auth=await client.auth.getCurrentUser();
 if(auth.error || !auth.data?.user)return {error:Response.json({error:'Sign in first.'},{status:401})};
 const result=await client.database.from('versions').select('id,project_id,number,files,acceptance,parent_version_id').eq('id',versionId).eq('project_id',id).maybeSingle();
 if(result.error)return {error:Response.json({error:'Could not read version.'},{status:503})};
 if(!result.data)return {error:Response.json({error:'Version not found.'},{status:404})};
 return {client,userId:auth.data.user.id,version:result.data,contract:readContract(result.data.acceptance),digest:checkVersion(versionId,result.data.files as Files).digest};
}
export async function GET(_request:Request,context:Context){
 const loaded=await snapshot(context);if('error' in loaded)return loaded.error;
 const {client,version,contract,digest}=loaded;
 const evidence=await client.database.rpc('read_acceptance_evidence',{p_version:version.id});
 if(evidence.error)return Response.json({error:'Could not read acceptance evidence.'},{status:503});
 return Response.json({versionId:version.id,number:version.number,digest,contract,files:version.files,...(evidence.data as {observations:unknown[];baseline:unknown[]})},{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(request:Request,context:Context){
 const loaded=await snapshot(context);if('error' in loaded)return loaded.error;
 const parsed=observationInput.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Invalid acceptance evidence.'},{status:400});
 const input=parsed.data;
 const problem=observationProblem(input,loaded.contract,loaded.digest);
 if(problem)return Response.json({error:problem},{status:409});
 const db=insforgeAdmin().database;
 const prior=await db.from('acceptance_observations').select('id,version_id,criterion_id,user_id,digest,kind,status,evidence').eq('id',input.id).maybeSingle();
 if(prior.error)return Response.json({error:'Could not save evidence.'},{status:503});
 const row={id:input.id,version_id:loaded.version.id,criterion_id:input.criterionId,user_id:loaded.userId,digest:input.digest,kind:input.kind,status:input.status,evidence:input.evidence};
 if(prior.data){
  const same=Object.entries(row).every(([k,v])=>isDeepStrictEqual(v,(prior.data as Record<string,unknown>)[k]));
  return Response.json(same?{saved:true}:{error:'Evidence identifier already used.'},{status:same?200:409});
 }
 const result=await db.from('acceptance_observations').insert([row]);
 if(result.error)return Response.json({error:'Could not save evidence. Retry.'},{status:503});
 return Response.json({saved:true});
}
