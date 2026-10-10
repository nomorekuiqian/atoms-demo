import { it, expect } from "vitest";
import { useWorkspace } from "./workspace";
it("uses only the authoritative snapshot, even with a truncated draft", () => {
  const s=useWorkspace.getState();
  s.init({projectId:"p",title:"x",messages:[],files:{"old.js":"old"},versions:[],currentVersionId:null,publishedVersionId:null,publishedSlug:null});
  s.startRun("fix");
  s.apply({type:"file_start",path:"app.js"});
  s.apply({type:"file_delta",path:"app.js",delta:"function broken("});
  const event={type:"version_created" as const,versionId:"v",number:1,summary:"fixed",files:{"index.html":"saved"}};
  s.apply(event); s.apply(event);
  expect(useWorkspace.getState().files).toEqual(event.files);
  expect(useWorkspace.getState().versions).toHaveLength(1);
});
