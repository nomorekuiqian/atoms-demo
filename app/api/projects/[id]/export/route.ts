import {z} from 'zod';
import {insforgeServer} from '@/lib/insforge/server';
import {archiveFilename,sourceArchive} from '@/lib/export/archive';
import type {Files} from '@/lib/agents/types';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const fail=(status:number,error:string)=>Response.json({error},{status,headers});
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params,versionId=new URL(request.url).searchParams.get('versionId');
 if(!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(versionId).success)return fail(400,'Choose a saved version to export.');
 try {
  const client=await insforgeServer();const {data:auth,error:authError}=await client.auth.getCurrentUser();
  if(authError || !auth?.user)return fail(401,'Sign in to export source.');
  const {data:project,error:projectError}=await client.database.from('projects').select('title').eq('id',id).maybeSingle();
  if(projectError)return fail(503,'Could not read this project. Please retry.');
  if(!project)return fail(404,'Project not found.');
  const {data:version,error}=await client.database.from('versions').select('id,number,files').eq('project_id',id).eq('id',versionId!).maybeSingle();
  if(error)return fail(503,'Could not read this version. Please retry.');
  if(!version)return fail(404,'Version not found.');
  let bytes:Uint8Array;try{bytes=sourceArchive(version.files as Files,version);}catch{return fail(422,'This snapshot contains an unsafe path or exceeds the export limits.');}
  return new Response(Buffer.from(bytes),{headers:{...headers,'Content-Type':'application/zip','Content-Disposition':`attachment; filename="${archiveFilename(project.title,version.number)}"`,'X-Content-Type-Options':'nosniff'}});
 }catch{return fail(503,'Export is temporarily unavailable. Please retry.');}
}
