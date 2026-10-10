/** Literal URL resolution only. Never fetches or executes generated content. */
export function resolveResource(from: string, ref: string): {external?:string;path?:string;error?:string} {
  const value=ref.trim();
  if(!value || value.startsWith('#') || /^(data:|blob:)/i.test(value)) return {};
  if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return {external:value};
  let clean:string;
  try {clean=decodeURIComponent(value.split(/[?#]/)[0]);}catch{return{error:"Invalid resource URL"};}
  const parts=value.startsWith('/')?[]:from.split('/').slice(0,-1);
  for(const part of clean.split('/')) {
    if(!part || part==='.')continue;
    if(part==='..'){if(!parts.length)return{error:"Resource escapes the project"};parts.pop();}
    else parts.push(part);
  }
  return {path:parts.join('/')};
}

/** HTML allows quoted and unquoted attribute values. Match complete attribute names. */
export function htmlAttribute(tag: string, name: string): string | undefined {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"\\r\\n]*)"|'([^'\\r\\n]*)'|([^\\s>]+))`, "i");
  const match = re.exec(tag);
  return match ? match[1] ?? match[2] ?? match[3] : undefined;
}
export const RESOURCE_ATTR = /((?:^|\s)(?:src|href|poster)\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
export function dataUrl(content: string, mime: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(content)) binary += String.fromCharCode(byte);
  return `data:${mime};base64,${btoa(binary)}`;
}
