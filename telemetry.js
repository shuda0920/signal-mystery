(() => {
 const endpoint=window.LEARNING_ENDPOINT;
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint||''))return;
 let consent=false, sessionId=crypto.randomUUID(), attemptId=crypto.randomUUID(), opened=new Set(), hintLevel=0, transferChoice='';
 function record(type,choice){if(!consent)return;const ev={event_id:crypto.randomUUID(),session_id:sessionId,attempt_id:attemptId,case_id:'case-001',case_version:'1',event_type:type,choice,occurred_at:new Date().toISOString()};fetch(endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({events:[ev]}),keepalive:true}).catch(()=>{});}
 function notice(){if(!document.querySelector('.hero')||document.querySelector('#learning-consent'))return;const box=document.createElement('div');box.id='learning-consent';box.className='box';box.innerHTML='<label class="check"><input id="consent-check" type="checkbox"> <span>我同意記錄這次遊玩的匿名互動資料（查看證物、提示、查證、判斷與選項），用於改善遊戲與了解學習過程。資料送至遊戲管理者的 Google 試算表；不收集姓名、電子郵件或自由文字。可不勾選，仍可遊玩。</span></label><small>由於網路傳送限制，遊戲無法確認每筆資料是否成功寫入。</small>';document.querySelector('.hero .intro').after(box);box.querySelector('input').addEventListener('change',e=>{consent=e.target.checked;});}
 notice();
 app.addEventListener('click',e=>{const b=e.target.closest('[data-do]');if(!b)return;const a=b.dataset.do,id=b.dataset.id;
 if(a==='start')record('case_started','start');
 if(a==='clue'&&!opened.has(id)){opened.add(id);record('clue_opened',id);}
 if(a==='hint'&&hintLevel<2){hintLevel++;record('hint_used',String(hintLevel));}
 if(a==='verify')record('verification_selected',id);
 if(a==='submit'&&state.verdict&&state.action&&state.evidence.size>=2)record('report_submitted',{verdict:state.verdict,action:state.action,evidence:[...state.evidence]});
 if(a==='transfer'&&id!==transferChoice){transferChoice=id;record('transfer_selected',id);}
 if(a==='restart'){attemptId=crypto.randomUUID();opened=new Set();hintLevel=0;transferChoice='';consent=false;queueMicrotask(notice);}
 },true);
})();
