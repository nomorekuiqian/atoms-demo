import "server-only";
import {createHash} from "node:crypto";
import {checkFiles,type CheckRecord} from "./static";
import type {Files} from "@/lib/agents/types";
export function checkVersion(versionId:string,files:Files):CheckRecord {
  const canonical=JSON.stringify(Object.keys(files).sort().map(path=>[path,files[path]]));
  return {...checkFiles(files),versionId,digest:createHash('sha256').update(canonical).digest('hex'),checkedAt:new Date().toISOString(),kind:'static'};
}
