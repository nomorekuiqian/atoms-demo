import {it,expect} from 'vitest';
import {observationInput,observationProblem,isRegression,type SavedObservation} from './evidence';
import type {AcceptanceContract} from './contract';
const contract:AcceptanceContract={items:[{id:'add',requirement:'Add',procedure:'Click Add',expected:'1',mode:'automatic',steps:[{kind:'click',selector:'#add'},{kind:'expectText',selector:'#count',text:'1',match:'equals'}]}]};
it('requires evidence for all declared steps and exact snapshot',()=>{
 const input=observationInput.parse({id:'00000000-0000-4000-8000-000000000001',digest:'a'.repeat(64),criterionId:'add',kind:'automatic',status:'passed',evidence:{note:'Observed',sessionId:'session',steps:[{index:0,status:'passed',detail:'clicked'}]}});
 expect(observationProblem(input,contract,'b'.repeat(64))).toContain('different snapshot');
 expect(observationProblem(input,contract,input.digest)).toContain('Every declared step');
 input.evidence.steps!.push({index:1,status:'passed',detail:'1'});
 expect(observationProblem(input,contract,input.digest)).toBeNull();
});
it('does not call an untested baseline or manual confirmation an automatic regression',()=>{
 const current={kind:'automatic',status:'failed'} as SavedObservation;
 expect(isRegression(current,undefined)).toBe(false);
 expect(isRegression(current,{kind:'manual',status:'passed'} as SavedObservation)).toBe(false);
 expect(isRegression(current,{kind:'automatic',status:'passed'} as SavedObservation)).toBe(true);
});
