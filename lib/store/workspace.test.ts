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

it("updates coordinator and specialist tool rows independently", () => {
  const s = useWorkspace.getState();
  s.init({projectId:"p",title:"x",messages:[],files:{},versions:[],currentVersionId:null,publishedVersionId:null,publishedSlug:null});
  s.apply({type:"agent_start",agent:"mike",activity:"Coordinating"});
  s.apply({type:"tool_activity",agent:"mike",runId:"m",id:"delegate",tool:"buildApp",step:1,status:"running"});
  s.apply({type:"agent_start",agent:"alex",activity:"Building"});
  s.apply({type:"tool_activity",agent:"alex",runId:"a",id:"check",tool:"checkApp",step:2,status:"failed"});
  s.apply({type:"tool_activity",agent:"mike",runId:"m",id:"delegate",tool:"buildApp",step:1,status:"done"});
  const messages = useWorkspace.getState().messages;
  expect(messages[0].steps).toHaveLength(1);
  expect(messages[0].steps[0]).toMatchObject({id:"delegate",status:"done"});
  expect(messages[1].steps[0]).toMatchObject({id:"check",status:"failed"});
});
