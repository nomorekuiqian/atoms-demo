import {z} from 'zod';
import type {AcceptanceContract} from './contract';
export const observationInput=z.object({
 id:z.string().uuid(),digest:z.string().regex(/^[a-f0-9]{64}$/),criterionId:z.string().max(60),
 kind:z.enum(['manual','automatic']),status:z.enum(['passed','failed','inconclusive']),
 evidence:z.object({note:z.string().trim().min(1).max(1000),sessionId:z.string().max(100).optional(),steps:z.array(z.object({index:z.number().int().min(0).max(11),status:z.enum(['passed','failed','inconclusive']),detail:z.string().max(600)}).strict()).max(12).optional()}).strict(),
}).strict();
export type ObservationInput=z.infer<typeof observationInput>;
export type SavedObservation={id:string;criterion_id:string;kind:'manual'|'automatic';status:'passed'|'failed'|'inconclusive';evidence:ObservationInput['evidence'];created_at:string;digest:string;sequence:number};
export function observationProblem(input:ObservationInput,contract:AcceptanceContract,digest:string):string|null {
 if(input.digest!==digest)return 'This evidence belongs to a different snapshot.';
 const item=contract.items.find(i=>i.id===input.criterionId);
 if(!item)return 'Unknown acceptance criterion.';
 if(input.kind==='automatic'){
  if(item.mode!=='automatic')return 'This criterion requires a manual check.';
  const steps=input.evidence.steps??[];
  if(!input.evidence.sessionId)return 'Missing browser session.';
  if(steps.some((s,i)=>s.index!==i) || steps.length>item.steps.length)return 'Invalid step evidence.';
  if(input.status==='passed' && (steps.length!==item.steps.length || steps.some(s=>s.status!=='passed')))return 'Every declared step needs passing evidence.';
  if(input.status==='failed' && !steps.some(s=>s.status==='failed'))return 'A failed observation needs a failed step.';
 }
 return null;
}
/** Only a like-for-like automatic pass -> failure is called a regression. */
export function isRegression(current:SavedObservation|undefined,baseline:SavedObservation|undefined):boolean {
 return current?.kind==='automatic' && current.status==='failed' && baseline?.kind==='automatic' && baseline.status==='passed';
}
