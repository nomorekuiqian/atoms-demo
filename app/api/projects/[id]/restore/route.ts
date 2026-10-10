import { isRunConflict } from "@/lib/agents/conflict";
import { z } from "zod";
import { insforgeServer } from "@/lib/insforge/server";
import { insforgeAdmin } from "@/lib/insforge/admin";
export const dynamic = "force-dynamic";
const schema = z.object({versionId:z.string().uuid(),expectedVersionId:z.string().uuid().nullable()});
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const client=await insforgeServer();
  const {data:auth,error:authError}=await client.auth.getCurrentUser();
  if(authError || !auth?.user) return Response.json({error:"Sign in first."},{status:401});
  const body=schema.safeParse(await request.json().catch(()=>null));
  if(!body.success || !z.string().uuid().safeParse(id).success) return Response.json({error:"Invalid request."},{status:400});
  const {data,error}=await insforgeAdmin().database.rpc("restore_snapshot",{p_project:id,p_user:auth.user.id,p_source:body.data.versionId,p_expected:body.data.expectedVersionId});
  if(error) return Response.json({error:isRunConflict(error)?"Project changed. Reload before restoring.":"Could not restore this version. Please retry."},{status:isRunConflict(error)?409:500});
  if ((data as {conflict?:string})?.conflict) return Response.json({error:(data as {conflict:string}).conflict},{status:409});
  return Response.json(data);
}
