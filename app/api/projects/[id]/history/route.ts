import { z } from 'zod';
import { insforgeServer } from '@/lib/insforge/server';
import { HISTORY_PAGE_SIZE, MESSAGE_COLUMNS, toUIMessage, type MessageRow } from '@/lib/projects/history';

export const dynamic = 'force-dynamic';
const paramsSchema=z.object({kind:z.enum(['messages','versions']),before:z.coerce.number().int().positive().safe()});
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const parsed=paramsSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if(!parsed.success || !z.string().uuid().safeParse(id).success)return Response.json({error:'Invalid history cursor.'},{status:400});
  const client=await insforgeServer();
  const {data:auth,error:authError}=await client.auth.getCurrentUser();
  if(authError || !auth?.user)return Response.json({error:'Sign in first.'},{status:401});
  const {data:project,error}=await client.database.from('projects').select('id').eq('id',id).maybeSingle();
  if(error)return Response.json({error:'Could not read project.'},{status:503});
  if(!project)return Response.json({error:'Project not found.'},{status:404});
  const {kind,before}=parsed.data;
  const column=kind==='messages'?'sequence':'number';
  const result=await client.database.from(kind).select(kind==='messages'?MESSAGE_COLUMNS:'id, number, summary, created_at').eq('project_id',id).lt(column,before).order(column,{ascending:false}).limit(HISTORY_PAGE_SIZE+1);
  if(result.error)return Response.json({error:'Could not load older history. Retry.'},{status:503});
  const rows=result.data??[];
  const page=rows.slice(0,HISTORY_PAGE_SIZE);
  return Response.json({items:kind==='messages'?(page as unknown as MessageRow[]).toReversed().map(toUIMessage):page,nextBefore:rows.length>HISTORY_PAGE_SIZE?(page.at(-1) as unknown as {sequence:number;number:number})[column]:null},{headers:{'Cache-Control':'private, no-store'}});
}
