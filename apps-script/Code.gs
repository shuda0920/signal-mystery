// Deploy as a web app, executing as the owner. The sheet remains private.
const SPREADSHEET_ID = '10r5GetnrmuX5-aCE7eJoH6wFlnBF6vNfdzgv533HvkA';
const SHEET = 'learning_events';
const HEADERS = ['event_id','session_id','attempt_id','case_id','case_version','event_type','choice','occurred_at','received_at'];
const ALLOWED = {
  case_started: ['start'], clue_opened: ['message','site','order','contact'],
  hint_used: ['1','2'], verification_selected: ['link','app','reply'],
  report_submitted: null, transfer_selected: ['verify','click']
};
function doPost(e) {
  let lock;
  try {
    const body = e && e.postData && e.postData.contents;
    if (!body || body.length > 12000) throw new Error('Invalid payload');
    const data = JSON.parse(body);
    if (!data || !Array.isArray(data.events) || data.events.length < 1 || data.events.length > 25) throw new Error('Invalid events');
    const safeId = x => typeof x === 'string' && /^[a-zA-Z0-9-]{10,80}$/.test(x);
    const rows = data.events.map(ev => {
      if (!ev || !safeId(ev.event_id) || !safeId(ev.session_id) || !safeId(ev.attempt_id) || ev.case_id !== 'case-001' || ev.case_version !== '1' || !Object.prototype.hasOwnProperty.call(ALLOWED,ev.event_type)) throw new Error('Invalid event');
      if (typeof ev.occurred_at !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(ev.occurred_at)) throw new Error('Invalid timestamp');
      let choice = ev.choice;
      if (ev.event_type === 'report_submitted') {
        if (!choice || !['risk','safe','unknown'].includes(choice.verdict) || !['stop','pay','share'].includes(choice.action) || !Array.isArray(choice.evidence) || choice.evidence.length > 4 || !choice.evidence.every(x => ['conflict','urgency','order','name'].includes(x))) throw new Error('Invalid report');
        choice = JSON.stringify({verdict:choice.verdict,action:choice.action,evidence:choice.evidence});
      } else if (typeof choice !== 'string' || !ALLOWED[ev.event_type].includes(choice)) throw new Error('Invalid choice');
      return [ev.event_id,ev.session_id,ev.attempt_id,ev.case_id,ev.case_version,ev.event_type,choice,ev.occurred_at,new Date().toISOString()];
    });
    lock = LockService.getScriptLock(); lock.waitLock(10000);
    const book = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = book.getSheetByName(SHEET);
    if (!sheet) { sheet = book.insertSheet(SHEET); sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]); sheet.setFrozenRows(1); }
    const n = sheet.getLastRow();
    const existing = new Set(n > 1 ? sheet.getRange(2,1,n-1,1).getValues().map(r => r[0]) : []);
    const unique = rows.filter(row => { if (existing.has(row[0])) return false; existing.add(row[0]); return true; });
    if (unique.length) sheet.getRange(n+1,1,unique.length,HEADERS.length).setValues(unique);
    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ok:true,accepted:unique.length})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    console.error('Event ingestion failed: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({ok:false})).setMimeType(ContentService.MimeType.JSON);
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
