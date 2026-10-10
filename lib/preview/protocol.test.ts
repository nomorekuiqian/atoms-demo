import {it,expect} from 'vitest';
import {parsePreviewMessage} from './protocol';
const base={source:'atoms-preview',sessionId:'new',versionId:'v2'};
it('rejects old sessions, other versions and malformed bridge payloads',()=>{
 expect(parsePreviewMessage({...base,type:'ready'},'new','v2')).not.toBeNull();
 expect(parsePreviewMessage({...base,type:'ready',sessionId:'old'},'new','v2')).toBeNull();
 expect(parsePreviewMessage({...base,type:'ready'},'new','v1')).toBeNull();
 expect(parsePreviewMessage({...base,type:'console',level:'error',text:42},'new','v2')).toBeNull();
 expect(parsePreviewMessage({...base,type:'storage',data:{secret:'x'.repeat(9000)}},'new','v2')).toBeNull();
 expect(parsePreviewMessage({...base,type:'error',message:'syntax error',stack:null},'new','v2')).not.toBeNull();
});
