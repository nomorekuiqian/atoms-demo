// Fixed independently of generated output. IDs are part of both arms' input contract.
const click=selector=>({kind:'click',selector}),fill=(selector,value)=>({kind:'fill',selector,value}),text=(selector,text)=>({kind:'expectText',selector,text,match:'equals'});
const criterion=(id,steps)=>({id,requirement:id,procedure:'Perform the fixed benchmark steps',expected:'Every fixed assertion holds',mode:'automatic',steps});
const counter={'index.html':'<!doctype html><html><head><title>Counter</title></head><body><output id="count">0</output><button id="add">Add</button><button id="reset">Reset</button><script src="app.js"></script></body></html>','app.js':`let n=Number(localStorage.getItem('count')||0);const render=()=>{document.querySelector('#count').textContent=n;localStorage.setItem('count',n)};document.querySelector('#add').onclick=()=>{n++;render()};document.querySelector('#reset').onclick=()=>{n=0;render()};render();`};
const add=criterion('add',[click('#add'),text('#count','1'),click('#add'),text('#count','2')]);
const reset=criterion('reset',[click('#add'),text('#count','1'),click('#reset'),text('#count','0')]);
const persist=criterion('persist',[click('#add'),text('#count','1'),{kind:'reload'},text('#count','1')]);
const task=(id,kind,prompt,checks,files={},errors=[])=>({id,kind,prompt,checks,files,errors});
export const tasks=[
 task('new-counter','new','Build a compact counter starting at 0. #add increments, #reset resets, #count displays the integer. Persist the count across reload with localStorage.',[add,reset,persist]),
 task('new-todo','new','Build a todo app: #task input, #add button, #list container. Adding a nonempty task clears the input, renders text inside #list; reject whitespace-only additions. #clear removes all tasks. Persist across reload.',[
 criterion('todo-add',[fill('#task','Buy milk'),click('#add'),{kind:'expectText',selector:'#list',text:'Buy milk',match:'contains'}]),
 criterion('todo-clear',[fill('#task','Buy milk'),click('#add'),click('#clear'),text('#total','0')]),
 criterion('todo-persist',[fill('#task','Buy milk'),click('#add'),{kind:'reload'},{kind:'expectText',selector:'#list',text:'Buy milk',match:'contains'}])]),
 task('new-calculator','new','Build an addition calculator with numeric inputs #a, #b, button #calculate and output #result. Always add numbers (not strings). Support decimal and negative operands.',[
 criterion('sum',[fill('#a','2'),fill('#b','3'),click('#calculate'),text('#result','5')]),
 criterion('negative',[fill('#a','-2'),fill('#b','0.5'),click('#calculate'),text('#result','-1.5')])]),
 task('new-tabs','new','Build accessible tabs. Buttons #tab-overview and #tab-details toggle sections #overview and #details. Overview is initially visible; Details initially hidden. Switching tabs updates aria-pressed true/false on both buttons.',[
 criterion('tabs-switch',[click('#tab-details'),{kind:'expectCount',selector:'#details',count:1},{kind:'expectCount',selector:'#overview',count:0},{kind:'expectAttribute',selector:'#tab-details',name:'aria-pressed',value:'true'}]),
 criterion('tabs-back',[click('#tab-details'),click('#tab-overview'),{kind:'expectCount',selector:'#overview',count:1},{kind:'expectCount',selector:'#details',count:0}])]),
 task('edit-style','edit','Restyle this counter with a calm blue theme, rounded controls and responsive centered card. Preserve all behavior and exact existing IDs.',[add,reset,persist],counter),
 task('edit-decrement','edit','Add a #subtract button that decreases the counter by 1, allowing negative values. Preserve add, reset and persistence.',[add,reset,persist,criterion('subtract',[click('#subtract'),text('#count','-1')])],counter),
 task('edit-double','edit','Add a #double button that doubles the current count. Preserve add, reset and persistence.',[add,reset,persist,criterion('double',[click('#add'),click('#double'),text('#count','2')])],counter),
 task('fix-inert','fix','Repair the counter: Add and Reset do nothing. Restore increment, reset and persisted state without changing existing IDs.',[add,reset,persist],{...counter,'app.js':'// Missing handlers'},['Add click leaves #count at 0 instead of 1.']),
 task('fix-string','fix','Repair this counter: after clicking Add twice the value must be 2. Preserve reset and persistence.',[add,reset,persist],{...counter,'app.js':counter['app.js'].replace('n++;','n=String(n)+1;')},['Add produces string concatenation (01) instead of numeric 1.']),
 task('fix-storage','fix','Repair this counter so values survive reload. Preserve add and reset.',[add,reset,persist],{...counter,'app.js':counter['app.js'].replace("Number(localStorage.getItem('count')||0)",'0')},['After Add then reload count is 0; expected 1.'])
];
// Make every required independent test selector explicit for both arms.
for(const t of tasks)t.prompt+='\nFixed acceptance steps and exact selectors: '+JSON.stringify(t.checks);
