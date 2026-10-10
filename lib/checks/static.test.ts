import {describe,it,expect} from 'vitest';
import {checkFiles,resolveResource} from './static';
describe('version static checks',()=>{
 it('accepts complete literal resources and resolves nested CSS references',()=>{
  const files={'index.html':'<link href="css/main.css"><script src="app.js"></script>','css/main.css':'div{background:url(../art.svg)}','app.js':'console.log("hi")','art.svg':'<svg/>'};
  expect(checkFiles(files).errors).toEqual([]);expect(checkFiles(files).unchecked.length).toBeGreaterThan(0);
 });
 it('finds missing HTML and CSS references, including unquoted URLs',()=>{
  expect(checkFiles({'index.html':'<img src=missing.svg><style>p{background:url(no.svg)}</style>'}).errors).toHaveLength(2);
 });
 it('rejects unsafe paths and size overflow',()=>{
  expect(checkFiles({'../bad.js':'x','index.html':'x'.repeat(100001)}).errors).toHaveLength(2);
  expect(resolveResource('style.css','%2e%2e/secret')).toHaveProperty('error');
 });
 it('never marks external or dynamic resources as verified',()=>{
  const r=checkFiles({'index.html':'<script src="https://example.com/a.js"></script>'});
  expect(r.dependencies).toEqual(['https://example.com/a.js']);expect(r.unchecked.length).toBeGreaterThan(0);
 });
 it('reports a missing entry and ignores comments and anchors',()=>{
  expect(checkFiles({}).errors[0].path).toBe('index.html');
  expect(checkFiles({'index.html':'<!-- <img src="bad"> --><a href="#local">go</a>'}).errors).toEqual([]);
 });
});
