import {it,expect} from 'vitest';import {elementContextSchema,elementProblem} from './element';import {parsePreviewMessage} from '@/lib/preview/protocol';
const versionId='00000000-0000-4000-8000-000000000001',element={versionId,tag:'button',selector:'main:nth-of-type(1) > button:nth-of-type(2)',text:'Start'};
it('bounds element clues and rejects form values or arbitrary extra fields',()=>{
 expect(elementContextSchema.safeParse(element).success).toBe(true);
 for(const extra of [{value:'secret'},{text:'x'.repeat(161)},{selector:'x'.repeat(301)},{tag:'<script>'}])expect(elementContextSchema.safeParse({...element,...extra}).success).toBe(false);
 expect(elementProblem(element,null)).toContain('another version');expect(elementProblem(element,versionId)).toBeNull();
});
it('binds selection to the current preview identity and validates nested version',()=>{
 const message={source:'atoms-preview',sessionId:'current',versionId,type:'element-selected',element};
 expect(parsePreviewMessage(message,'current',versionId)).not.toBeNull();
 expect(parsePreviewMessage(message,'old',versionId)).toBeNull();
 expect(parsePreviewMessage({...message,element:{...element,versionId:'00000000-0000-4000-8000-000000000002'}},'current',versionId)).toBeNull();
});
