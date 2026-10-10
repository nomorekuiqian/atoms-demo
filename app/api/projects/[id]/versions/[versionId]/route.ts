import {z} from "zod";
import {insforgeServer} from "@/lib/insforge/server";
import {checkVersion} from "@/lib/checks/server";
import type {Files} from "@/lib/agents/types";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string;versionId:string}>}) {
  const {id,versionId}=await params;
  if(!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(versionId).success)return Response.json({error:'Invalid version.'},{status:400});
  const client=await insforgeServer();
  const {data:auth,error:authError}=await client.auth.getCurrentUser();
  if(authError || !auth?.user)return Response.json({error:'Sign in first.'},{status:401});
  const {data,error}=await client.database.from('versions').select('id,number,files,summary,created_at').eq('id',versionId).eq('project_id',id).maybeSingle();
  if(error)return Response.json({error:'Could not load this version. Please retry.'},{status:503});
  if(!data)return Response.json({error:'Version not found.'},{status:404});
  return Response.json({version:data,checks:checkVersion(data.id,data.files as Files)},{headers:{'Cache-Control':'private, no-store'}});
}
