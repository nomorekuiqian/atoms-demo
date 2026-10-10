import {describe,it,expect} from 'vitest';
import {criterionSchema,parseRequirements,extendContract,changeCriterion} from './contract';
const item={id:'counter',requirement:'Counter increases',procedure:'Click Add',expected:'Count is 1',mode:'automatic',steps:[{kind:'click',selector:'#add'},{kind:'expectText',selector:'#count',text:'1',match:'equals'}]};
describe('acceptance contracts',()=>{
 it('rejects arbitrary code, host selectors and vacuous automatic success',()=>{
  expect(criterionSchema.safeParse({...item,steps:[{kind:'evaluate',code:'fetch(secret)'}]}).success).toBe(false);
  expect(criterionSchema.safeParse({...item,steps:[{kind:'click',selector:'body button'}]}).success).toBe(false);
  expect(criterionSchema.safeParse({...item,steps:[{kind:'wait',ms:100}]}).success).toBe(false);
  expect(criterionSchema.safeParse(item).success).toBe(true);
 });
 it('labels malformed model output as unverified rather than inventing tests',()=>{
  expect(parseRequirements('- Works great').items).toEqual([]);
  expect(parseRequirements('- Works great').notice).toContain('not been functionally verified');
 });
 it('preserves old promises when the model attempts to weaken them',()=>{
  const old=criterionSchema.parse(item);
  const contract=extendContract({items:[old]},{items:[{...old,steps:[{kind:'expectCount',selector:'#add',count:1}]}]});
  expect(contract.items[0]).toEqual(old);
  expect(changeCriterion('Make it dark','request-1').mode).toBe('manual');
 });
});
