const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');

function server() {
  const sheets = new Map();
  const cache = new Map();
  const sent = [];
  const state = { account:'enviosfragua@gmail.com', quota:100, mailError:false, preview:null };
  function sheet(rows = []) {
    const data = rows;
    return {
      data,
      getLastRow: () => data.length,
      getLastColumn: () => Math.max(0, ...data.map(row => row.length)),
      getDataRange: () => ({ getValues: () => data.length ? data.map(row => [...row]) : [['']] }),
      getRange(row, col, height = 1, width = 1) {
        return {
          getValues: () => Array.from({length:height},(_,i) => Array.from({length:width},(_,j) => data[row + i - 1]?.[col + j - 1] ?? '')),
          setNumberFormat() {
            if (width > 1) throw new Error('Haz una selección en una sola columna para realizar acciones a nivel de columna.');
            return this;
          },
          setValue(value) { return this.setValues([[value]]); },
          setValues(values) {
            values.forEach((line,i) => { data[row + i - 1] ||= []; line.forEach((value,j) => {data[row + i - 1][col + j - 1] = value;}); });
            return this;
          }
        };
      },
      setFrozenRows() {},
      deleteRow: row => data.splice(row - 1,1)
    };
  }
  const spreadsheet = {
    getSheetByName: name => sheets.get(name),
    insertSheet(name) {const value=sheet();sheets.set(name,value);return value;},
    getUrl: () => 'https://example.test/spreadsheet'
  };
  const context = {
    console:{log() {}},
    SpreadsheetApp:{getActiveSpreadsheet:() => spreadsheet,flush() {},getUi:() => ({showModalDialog:(output,title) => {state.preview={output,title};}})},
    HtmlService:{createHtmlOutput:html => ({html,setWidth(value) {this.width=value;return this;},setHeight(value) {this.height=value;return this;}})},
    CacheService:{getScriptCache:() => ({get:key => cache.get(key),put:(key,value) => cache.set(key,value),remove:key => cache.delete(key)})},
    LockService:{getScriptLock:() => ({waitLock() {},releaseLock() {}})},
    Session:{getEffectiveUser:() => ({getEmail:() => state.account})},
    ScriptApp:{AuthMode:{FULL:'FULL'},requireScopes:(mode,scopes) => {assert.equal(mode,'FULL');assert.equal(scopes[0],'https://www.googleapis.com/auth/script.send_mail');}},
    MailApp:{getRemainingDailyQuota:() => state.quota,sendEmail(to,subject,text,options) {if(state.mailError)throw Error('Mail service unavailable');sent.push({to,subject,text,options});}},
    Utilities:{getUuid:() => crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_algorithm,text) => [...crypto.createHash('sha256').update(text).digest()],base64Decode:value => Buffer.from(value,'base64'),newBlob:(data,type,name) => ({data,type,name})},
    ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'js'},createTextOutput:value => ({value,setMimeType() {return this;}})}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'apps_script_envios.gs'),'utf8'),context);
  const post = params => JSON.parse(context.doPost({parameter:params}).value);
  context.cambiarAdministradorFragua();
  const login = post({action:'login',usuario:'Fragua',password:'2107'});
  assert.equal(login.ok,true);
  return {post,context,sheets,sent,state,token:login.token};
}

const guide = () => ({Numero:'FRG-001',Remitente:'Fragua',Destinatario:'Peaje Zaragoza',Direccion:'Dirección de prueba',Estado:'Pendiente',Peso:2,Pedidos:JSON.stringify([{descripcion:'Caja <frágil>',cantidad:1,valor:20000,peso:2}])});

test('departure belongs to the server and survives edits in transit',() => {
  const s=server();
  const save=g => s.post({action:'upsert',token:s.token,guia:JSON.stringify(g)});
  const read=() => s.post({action:'search',numero:'FRG-001'}).data[0];
  save({...guide(),SalidaEn:'forged'});
  assert.equal(read().SalidaEn,'');
  save({...guide(),Estado:'En tránsito'});
  const departure=read().SalidaEn;
  assert.ok(Number.isFinite(Date.parse(departure)));
  save({...guide(),Estado:'En tránsito',SalidaEn:'forged'});
  assert.equal(read().SalidaEn,departure);
  save({...guide(),Estado:'Entregado'});
  assert.equal(read().SalidaEn,departure);
});

test('reported departure helper only updates OPER-55511 without sending mail',() => {
  const s=server();
  const save=g => s.post({action:'upsert',token:s.token,guia:JSON.stringify(g)});
  save(guide());
  assert.throws(()=>s.context.registrarSalidaOper55511(),/OPER-55511/);
  save({...guide(),Numero:'OPER-55511',Estado:'En tránsito'});
  const mails=s.sent.length;
  s.context.registrarSalidaOper55511();
  const rows=s.post({action:'search',token:s.token}).data;
  assert.equal(rows.find(g=>g.Numero==='OPER-55511').SalidaEn,'2026-10-30T18:26:25.000Z');
  assert.equal(rows.find(g=>g.Numero==='FRG-001').SalidaEn,'');
  assert.equal(s.sent.length,mails);
});

test('creation stores online and sends one email; repeated saves do not duplicate notification',() => {
  const s = server();
  let response = s.post({action:'upsert',mode:'create',token:s.token,guia:JSON.stringify(guide())});
  assert.equal(response.ok,true);
  assert.equal(response.notification.sent,true);
  assert.equal(s.sent.length,1);
  assert.equal(s.sent[0].to,'peajezaragoza@zimaseguridad.com.co');
  assert.equal(s.sent[0].options.replyTo,'enviosfragua@gmail.com');
  assert.ok(s.sent[0].options.inlineImages.zimaLogo);
  assert.match(s.sent[0].options.htmlBody,/Caja &lt;frágil&gt;/);
  let current = s.post({action:'search',token:s.token}).data[0];
  response = s.post({action:'upsert',mode:'update',token:s.token,guia:JSON.stringify(current)});
  assert.equal(response.notification.alreadySent,true);
  assert.equal(s.sent.length,1);
  current = s.post({action:'search',token:s.token}).data[0];
  current.Estado = 'En tránsito';
  response = s.post({action:'upsert',mode:'update',token:s.token,guia:JSON.stringify(current)});
  assert.equal(response.notification.sent,true);
  assert.equal(s.sent.length,2);
  const duplicate = s.post({action:'upsert',mode:'create',token:s.token,guia:JSON.stringify(guide())});
  assert.equal(duplicate.ok,false);
  assert.equal(s.sent.length,2);
});

test('failed email preserves the saved guide and records a recoverable pending state',() => {
  const s = server();s.state.mailError=true;
  const saved = s.post({action:'upsert',token:s.token,guia:JSON.stringify(guide())});
  assert.equal(saved.ok,true);
  assert.equal(saved.notification.sent,false);
  const current = s.post({action:'search',token:s.token}).data[0];
  assert.equal(current.Notificacion,'Pendiente');
  assert.equal(JSON.parse(current.Pedidos)[0].valor,20000);
  s.state.mailError=false;
  const retry = s.post({action:'notify',token:s.token,numero:'FRG-001',force:'true'});
  assert.equal(retry.notification.sent,true);
  assert.equal(s.sent.length,1);
});

test('status update accepts a Sheets Date revision and sends the new status to the configured address',() => {
  const s=server();
  s.post({action:'upsert',mode:'create',token:s.token,guia:JSON.stringify(guide())});
  const sheet=s.sheets.get('Tabla_1');
  const revisionColumn=sheet.data[0].indexOf('ActualizadoEn');
  sheet.data[1][revisionColumn]=new Date(sheet.data[1][revisionColumn]);
  const current=s.post({action:'search',token:s.token}).data[0];
  current.Estado='Entregado';
  const result=s.post({action:'upsert',mode:'update',token:s.token,guia:JSON.stringify(current)});
  assert.equal(result.ok,true,result.msg);
  assert.equal(result.notification.sent,true);
  assert.equal(s.sent.length,2);
  assert.match(s.sent[1].subject,/Entregado/);
  assert.match(s.sent[1].options.htmlBody,/<strong>Entregado<\/strong>/);
  assert.equal(s.sent[1].to,'peajezaragoza@zimaseguridad.com.co');
});

test('email preview uses the supported getUi API, embeds the logo and does not send mail',() => {
  const s=server();
  s.context.vistaPreviaCorreoFragua();
  assert.equal(s.sent.length,0);
  assert.ok(s.state.preview);
  assert.equal(s.state.preview.output.width,650);
  assert.equal(s.state.preview.output.height,720);
  assert.match(s.state.preview.output.html,/data:image\/jpeg;base64,/);
  assert.doesNotMatch(s.state.preview.output.html,/cid:zimaLogo/);
});

test('sending uses the executing account without aliases and preserves the configured reply address',() => {
  const s=server();s.state.account='other@example.test';
  const saved=s.post({action:'upsert',token:s.token,guia:JSON.stringify(guide())});
  assert.equal(saved.notification.sent,true);
  assert.equal(s.sent.length,1);
  assert.equal(s.sent[0].options.from,undefined);
  assert.equal(s.sent[0].options.replyTo,'enviosfragua@gmail.com');
  const authorization=s.context.autorizarNotificacionesFragua();
  assert.equal(authorization.sender,'other@example.test');
  assert.equal(authorization.ready,true);
  assert.equal(s.sent.length,1,'Authorization must not send a test message');
  s.state.quota=0;
  assert.throws(()=>s.context.autorizarNotificacionesFragua(),/cuota/);
});

test('sessions protect mutations and full lists; expired sessions and stale edits are rejected',() => {
  const s=server();
  assert.equal(s.post({action:'upsert',guia:JSON.stringify(guide())}).code,'SESSION_EXPIRED');
  assert.equal(s.post({action:'search'}).code,'SESSION_EXPIRED');
  s.post({action:'upsert',token:s.token,guia:JSON.stringify(guide())});
  const stale=guide();stale.ActualizadoEn='old-version';
  assert.equal(s.post({action:'upsert',mode:'update',token:s.token,guia:JSON.stringify(stale)}).ok,false);
  const lookup=s.post({action:'search',numero:'FRG-001',hoja:'Usuarios'});
  assert.equal(lookup.data[0].Numero,'FRG-001');
  assert.equal(lookup.data[0].Password,undefined);
  assert.equal(s.post({action:'delete',token:s.token,numero:'FRG-001'}).deleted,1);
  s.post({action:'logout',token:s.token});
  assert.equal(s.post({action:'session',token:s.token}).code,'SESSION_EXPIRED');
});

test('browser client stores only the temporary session token and fails closed without server confirmation',async () => {
  const entries=new Map();let reply={ok:true,token:'server-token',user:{usuario:'Fragua'}};
  const context={URLSearchParams,AbortSignal,Event,sessionStorage:{getItem:key => entries.get(key)||'',setItem:(key,value) => entries.set(key,value),removeItem:key => entries.delete(key)},navigator:{onLine:true},window:{dispatchEvent() {}},fetch:async()=>({ok:true,json:async()=>reply})};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'apps-script-client.js'),'utf8'),context);
  await context.window.FraguaAPI.login('Fragua','2107');
  assert.deepEqual([...entries.entries()],[['fragua_session_token','server-token']]);
  context.navigator.onLine=false;
  await assert.rejects(()=>context.window.FraguaAPI.request('upsert'),/No hay conexión/);
  context.navigator.onLine=true;reply={ok:false,code:'SESSION_EXPIRED',msg:'expired'};
  await assert.rejects(()=>context.window.FraguaAPI.request('session'),/expired/);
  assert.equal(entries.size,0);
  for(const file of ['home.html','panel.js','login.html','login.js','consulta.html','consulta_externa.html']) {
    assert.doesNotMatch(fs.readFileSync(path.join(root,file),'utf8'),/localStorage|indexedDB/);
  }
});
