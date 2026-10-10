import {z} from 'zod';
/** User-controlled clues, never trusted instructions or proof of a source location. */
export const elementContextSchema=z.object({versionId:z.string().uuid(),tag:z.string().regex(/^[a-z][a-z0-9-]{0,30}$/),selector:z.string().min(1).max(300),text:z.string().max(160)}).strict();
export type ElementContext=z.infer<typeof elementContextSchema>;
export function elementProblem(element:ElementContext|undefined,versionId:string|null){return element && element.versionId!==versionId?'Selected element belongs to another version. Select it again from the current preview.':null;}
