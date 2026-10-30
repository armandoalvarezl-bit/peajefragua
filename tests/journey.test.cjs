const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = {window:{},setInterval() {}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../seguimiento-recorrido.js'),'utf8'),context);
const journey = context.window.FraguaJourney;
const departure = '2026-10-30T18:26:25.000Z';
const start = Date.parse(departure);
test('45 minute estimate advances without confirming delivery',() => {
  assert.equal(journey.calculate('En tránsito',departure,start).remaining,'45 min 00 s');
  const near = journey.calculate('En tránsito',departure,start + 44*60000);
  assert.equal(near.remaining,'1 min 00 s');
  assert.equal(near.mode,'moving');
  assert.ok(near.progress > 97 && near.progress < 100);
  const due = journey.calculate('En tránsito',departure,start + 45*60000);
  assert.equal(due.mode,'due');
  assert.equal(due.remaining,'Entrega por confirmar');
  assert.equal(due.progress,98);
  assert.equal(journey.calculate('Entregado',departure,start).progress,100);
});
test('missing, future and pending departures do not invent progress',() => {
  assert.equal(journey.calculate('En tránsito','',start).mode,'unknown');
  assert.equal(journey.calculate('En tránsito',departure,start-1000).progress,0);
  assert.equal(journey.calculate('Pendiente',departure,start+60000).progress,0);
  assert.doesNotMatch(journey.render({estado:'"<script>',departure:'"<script>'}),/<script>/);
});
