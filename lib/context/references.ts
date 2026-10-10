import {z} from 'zod';
import {validatePath} from '@/lib/parser/fileStreamParser';
import type {Files} from '@/lib/agents/types';
export const fileReferenceSchema=z.object({path:z.string().min(1).max(200),versionId:z.string().uuid()});
export type FileReference=z.infer<typeof fileReferenceSchema>;
/** The caller has already loaded this project's current snapshot through RLS. */
export function referenceProblem(refs:FileReference[],versionId:string|null,files:Files):{status:400|409;message:string}|null {
 if(refs.length>6)return{status:400,message:'Select at most 6 files.'};
 if(refs.some(ref=>ref.versionId!==versionId))return{status:409,message:'Referenced files belong to another version. Remove them and select files from the current version.'};
 if(new Set(refs.map(ref=>ref.path)).size!==refs.length)return{status:400,message:'A file can only be referenced once.'};
 if(refs.some(ref=>validatePath(ref.path) || !Object.hasOwn(files,ref.path)))return{status:400,message:'A referenced file is not in this project snapshot.'};
 return null;
}
