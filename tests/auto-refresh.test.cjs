const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function panel() {
  const nodes=new Map();
  const element=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{value:'',textContent:'',innerHTML:'',dataset:{},style:{},classList:{contains:()=>false,toggle(){},remove(){}},setAttribute(){}});
    return nodes.get(selector);
  };
  let calls=0,resolve;
  const context={window:{},document:{hidden:false,querySelector:element,querySelectorAll:()=>[],addEventListener(){}},navigator:{onLine:true},FraguaAPI:{hasSession:()=>true,request(){calls++;return new Promise(done=>resolve=done);}},FraguaDashboard:{render(){}},setTimeout(){},clearTimeout(){}};
  vm.createContext(context);
  const source=fs.readFileSync(path.join(__dirname,'../panel.js'),'utf8');
  vm.runInContext(source.replace(/\}\(\)\);\s*$/,'window.testPanel={autoRefresh,run};}());'),context);
  return {context,nodes,element,api:context.window.testPanel,calls:()=>calls,finish:()=>resolve({ok:true,data:[]})};
}
test('background refresh avoids duplicate requests and preserves form input',async()=>{
  const p=panel();p.element('#guia-rem').value='Editing this sender';
  const first=p.api.autoRefresh();
  await p.api.autoRefresh();
  assert.equal(p.calls(),1);
  p.finish();await first;
  assert.equal(p.element('#guia-rem').value,'Editing this sender');
});
test('hidden and offline tabs skip polling; next cycle retries',async()=>{
  const p=panel();p.context.document.hidden=true;await p.api.autoRefresh();
  p.context.document.hidden=false;p.context.navigator.onLine=false;await p.api.autoRefresh();
  assert.equal(p.calls(),0);
  p.context.navigator.onLine=true;const refresh=p.api.autoRefresh();assert.equal(p.calls(),1);p.finish();await refresh;
});
test('user mutations wait for an in-flight refresh and polling pauses during work',async()=>{
  const p=panel();const refresh=p.api.autoRefresh();let changed=false;
  const work=p.api.run('Saving',async()=>{changed=true;await p.api.autoRefresh();});
  assert.equal(changed,false);
  p.finish();await refresh;await work;
  assert.equal(changed,true);assert.equal(p.calls(),1);
});
