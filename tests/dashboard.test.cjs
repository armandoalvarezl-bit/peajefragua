const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../dashboard.js'),'utf8'),context);
const summarize=context.window.FraguaDashboard.summarize;
test('dashboard groups real guides by state and Colombian calendar date',()=>{
  const result=summarize([
    {estado:'Pendiente',created_at:'2026-10-30T04:59:00Z',peso:2,notification:'Pendiente'},
    {estado:'En tránsito',created_at:'2026-10-30T05:00:00Z',peso:'3.5',notification:'Enviada'},
    {estado:'Entregado',created_at:'2026-10-24T18:00:00Z',peso:'invalid'},
    {estado:'Cancelado',created_at:'invalid',peso:-10}
  ],new Date('2026-10-30T06:00:00Z'));
  assert.deepEqual(Array.from(result.counts),[1,1,1,1]);
  assert.equal(result.todayCount,1);
  assert.equal(result.week,3);
  assert.equal(result.days[6].count,1);
  assert.equal(result.days[5].count,1);
  assert.equal(result.weight,5.5);
  assert.equal(result.pendingMail,1);
});
test('empty dashboard has seven zero days and no invented metrics',()=>{
  const result=summarize([],new Date('2026-10-30T06:00:00Z'));
  assert.equal(result.total,0);
  assert.equal(result.week,0);
  assert.equal(result.days.length,7);
  assert.ok(result.days.every(day=>day.count===0));
});
