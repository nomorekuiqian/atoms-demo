import { z } from 'zod';

const selector = z.string().max(120).regex(/^(#[A-Za-z][\w-]*|\[data-testid="[A-Za-z][\w-]*"\])$/);
export const stepSchema = z.discriminatedUnion('kind', [
  z.object({kind:z.literal('click'),selector}).strict(),
  z.object({kind:z.literal('fill'),selector,value:z.string().max(300)}).strict(),
  z.object({kind:z.literal('expectText'),selector,text:z.string().min(1).max(300),match:z.enum(['equals','contains'])}).strict(),
  z.object({kind:z.literal('expectCount'),selector,count:z.number().int().min(0).max(100)}).strict(),
  z.object({kind:z.literal('expectAttribute'),selector,name:z.enum(['disabled','aria-pressed','aria-expanded','type']),value:z.string().max(100).nullable()}).strict(),
  z.object({kind:z.literal('wait'),ms:z.number().int().min(0).max(2000)}).strict(),
  z.object({kind:z.literal('reload')}).strict(),
]);
export type AcceptanceStep=z.infer<typeof stepSchema>;
export const criterionSchema=z.object({
  id:z.string().regex(/^[a-z][a-z0-9-]{0,59}$/),
  requirement:z.string().min(1).max(400),
  procedure:z.string().min(1).max(600),
  expected:z.string().min(1).max(400),
  mode:z.enum(['manual','automatic']),
  steps:z.array(stepSchema).max(12),
}).strict().superRefine((item,ctx)=>{
  if(item.mode==='automatic' && !item.steps.some(s=>s.kind.startsWith('expect')))ctx.addIssue({code:'custom',message:'Automatic checks require an assertion.'});
  if(item.mode==='manual' && item.steps.length)ctx.addIssue({code:'custom',message:'Manual checks cannot contain executable steps.'});
  if(item.steps.reduce((n,s)=>n+(s.kind==='wait'?s.ms:0),0)>6000)ctx.addIssue({code:'custom',message:'Wait budget exceeded.'});
});
export type Criterion=z.infer<typeof criterionSchema>;
export const contractSchema=z.object({items:z.array(criterionSchema).max(24),notice:z.string().max(800).optional()}).superRefine((c,ctx)=>{
  if(new Set(c.items.map(i=>i.id)).size!==c.items.length)ctx.addIssue({code:'custom',message:'Duplicate criterion identifiers.'});
});
export type AcceptanceContract=z.infer<typeof contractSchema>;
export const emptyContract=():AcceptanceContract=>({items:[],notice:'No acceptance contract was recorded for this version.'});
export function readContract(value:unknown):AcceptanceContract {
  const parsed=contractSchema.safeParse(value);return parsed.success?parsed.data:emptyContract();
}
export function parseRequirements(raw:string):AcceptanceContract {
  const start=raw.indexOf('{'),end=raw.lastIndexOf('}');
  try {
    const parsed=contractSchema.parse(JSON.parse(raw.slice(start,end+1)));
    if(parsed.items.length<3 || parsed.items.length>6)throw new Error('Expected 3–6 criteria');
    return parsed;
  }catch{return {items:[],notice:'The team did not return a valid acceptance checklist. This version has not been functionally verified.'};}
}
/** Existing promises are not silently removed or rewritten by the model. */
export function extendContract(previous:AcceptanceContract,proposed:AcceptanceContract):AcceptanceContract {
  const items=[...previous.items];
  for(const item of proposed.items)if(!items.some(i=>i.id===item.id || i.requirement===item.requirement))items.push(item);
  return {items:items.slice(0,24),notice:items.length>24?'Checklist limit reached; additional requirements need manual review.':proposed.notice};
}
export function changeCriterion(prompt:string,id:string):Criterion {
  return {id:`change-${id.replace(/[^a-z0-9]/g,'').slice(0,45)}`,requirement:prompt.slice(0,400),procedure:'Inspect and interact with the changed app, then compare it with your request.',expected:'The requested change is present and the existing controls still work.',mode:'manual',steps:[]};
}
