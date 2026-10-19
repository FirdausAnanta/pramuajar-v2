const generalPramaContext=()=>({classId:null,folderId:'general',planId:null,meetingIndex:0,topic:'Umum'});

pramaStore=function(){
 const data=state.prama||(state.prama={threads:[],active:null});
 data.threads??=[];data.openFolders??=[];
 for(const thread of data.threads){
  thread.folderId=thread.classId?'class:'+thread.classId:'general';
  thread.messages??=[];thread.draft??='';
 }
 return data;
};
startPrama=function(context=generalPramaContext(),force=false){
 const data=pramaStore(),classId=context.classId||null,folderId=classId?'class:'+classId:'general';
 let thread=!force&&data.threads.find(t=>t.folderId===folderId&&t.planId===(context.planId||null)&&(classId?t.topic===context.topic:true));
 if(!thread){
  thread={...context,classId,folderId,planId:context.planId||null,id:crypto.randomUUID(),created:new Date().toISOString(),messages:[],draft:''};
  data.threads.unshift(thread);
 }
 data.active=thread.id;persist();return thread;
};
currentPrama=function(){
 const data=pramaStore();
 return data.threads.find(t=>t.id===data.active&&(!t.classId||state.classes.some(c=>c.id===t.classId)))||startPrama();
};
function pramaThreadTitle(thread){return thread.title||thread.messages[0]?.question.slice(0,64)||'Percakapan baru';}
function pramaThreadList(folderId,activeId){
 const threads=pramaStore().threads.filter(t=>t.folderId===folderId);
 return threads.length?`<div class="prama-folder-threads">${threads.map(t=>`<button type="button" data-w="prama-open-thread" data-value="${wh(t.id)}" class="prama-thread-link" ${t.id===activeId?'aria-current="page"':''}><span>${wh(pramaThreadTitle(t))}</span></button>`).join('')}</div>`:'<p class="prama-folder-empty">Belum ada percakapan.</p>';
}
function pramaFoldersMarkup(){
 const active=currentPrama(),data=pramaStore();
 return `<div class="prama-folder-content">${btn('Percakapan baru','prama-new','','primary full')}
 <section class="prama-general-folder"><h2>${wb('Pembahasan umum','prama-open-general','',!active.classId?'prama-folder-selected':'text')}</h2>${pramaThreadList('general',active.id)}</section>
 <div class="prama-class-folder-heading"><h2>Folder kelas</h2><span>${state.classes.length}</span></div>
 ${state.classes.map(c=>`<details class="prama-class-folder" data-class-folder="${wh(c.id)}" ${data.openFolders.includes(c.id)||active.classId===c.id?'open':''}><summary>${icon('book')}<span><strong>${wh(c.name)}</strong><small>${wh(c.subject)}</small></span></summary><div class="prama-folder-body">${wb('Percakapan baru di '+wh(c.name),'prama-new-in-folder',c.id,'text')}${pramaThreadList('class:'+c.id,active.id)}</div></details>`).join('')||'<p class="prama-folder-empty">Tambahkan kelas untuk memisahkan pembahasan kelas.</p>'}
 </div>`;
}
pramaConversation=function(thread){
 const c=thread.classId?classBy(thread.classId):null;
 const context=c?`${c.name} · ${c.subject}`:'Pembahasan umum';
 const emptyWelcome = `<section class="prama-hero-card">   <div class="prama-hero-badge-wrap">
     <img src="pramuajar-assets-v2/img/prama-bot.png" alt="Prama Asisten Guru" class="prama-hero-avatar-large">
     <div class="prama-online-dot" title="Prama Siap Membantu"></div>
   </div>
   <h2 style="font-size:20px;font-weight:700;margin:12px 0 6px 0">${c?'Ada yang bisa dibantu untuk '+wh(c.name)+'?':'Halo, Bu Ananta! Senang bertemu Anda.'}</h2>
   <p class="lead" style="max-width:540px;margin:0 auto 20px auto;font-size:13.5px;line-height:1.6;color:var(--muted)">
     ${c?'Ceritakan keadaan kelas, tanyakan saran diferensiasi, atau minta bantuan menyiapkan kegiatan pembelajaran.':'Saya Prama, asisten AI pendamping Anda. Tanyakan ide kegiatan, rancangan diferensiasi, atau diskusikan draf refleksi harian.'}
   </p>
   <div class="prama-prompt-chips">
     <button type="button" class="prama-prompt-chip chip-cyan" data-prama-prompt="Bagaimana cara mendiferensiasikan latihan untuk materi pecahan desimal?">
       Ide diferensiasi pecahan desimal
     </button>
     <button type="button" class="prama-prompt-chip chip-emerald" data-prama-prompt="Bantu saya membuat ice breaking 5 menit yang mengasah fokus siswa sebelum mulai belajar.">
       Ice breaking fokus 5 menit
     </button>
     <button type="button" class="prama-prompt-chip chip-purple" data-prama-prompt="Tadi saat mengajar, beberapa siswa pasif dalam diskusi kelompok. Apa saran perbaikan?">
       Mengatasi siswa pasif di kelompok
     </button>
     <button type="button" class="prama-prompt-chip chip-amber" data-prama-prompt="Bantu susun draf catatan refleksi untuk pertemuan matematika hari ini.">
       Draf refleksi matematika hari ini
     </button>
   </div>
 </section>`;

 return `<header class="prama-chat-heading">
   <div class="row" style="align-items:center;gap:12px">
     <img src="pramuajar-assets-v2/img/prama-bot.png" alt="Prama Asisten Guru" class="prama-heading-avatar">
     <div>
       <strong>${wh(context)}</strong>
       <p>${c?(thread.planId?'Membahas perangkat yang sedang dibuka':'Percakapan tersimpan di folder kelas ini.'):'Tanyakan apa saja, mulai dari ide sampai kebutuhan sehari-hari.'}</p>
     </div>
   </div>
 </header>
 <div class="prama-thread" role="log" aria-label="Percakapan dengan Prama" aria-live="polite">${thread.messages.length?thread.messages.map(message=>pramaMessageMarkup(message,thread)).join(''):emptyWelcome}</div>
 <form class="prama-composer" id="prama-chat-form"><label class="field prama-input-label"><span>Pesan untuk Prama</span><textarea name="question" data-prama-draft required maxlength="${c?1600:6000}" placeholder="${c?'Tanyakan atau ceritakan tentang kelas ini…':'Tanyakan apa saja ke Prama…'}" rows="2">${wh(thread.draft)}</textarea></label><div class="row between" style="align-items:center">${btn(icon('mic')+' Ucapkan','prama-voice')}<button type="submit" class="btn primary">Kirim ${icon('arrow')}</button></div><p class="field-note" data-prama-status role="status">Prama prototipe merespons simulasi terarah. Enter untuk mengirim, Shift+Enter untuk baris baru.</p></form>`;
};
pramaView=function(){
 const thread=currentPrama();
 return heading('Prama','Ruang untuk pertanyaan, ide, dan percakapan Anda.',wb('Folder & percakapan','prama-folder-menu','','prama-mobile-folders'))+
 `<div class="prama-folder-layout"><aside class="prama-folders" aria-label="Folder dan riwayat percakapan">${pramaFoldersMarkup()}</aside><section class="prama-conversation prama-folder-chat">${pramaConversation(thread)}</section></div>`;
};
function newPramaConversation(classId=null){
 if(recognition){recognition.stop();recognition=null;}
 startPrama(classId?pramaContext(classId):generalPramaContext(),true);
 closeModal();refreshPrama();
 const root=pramaPanel.open?pramaPanel:$('#main');root?.querySelector('[data-prama-draft]')?.focus({preventScroll:true});
}
refreshPrama=function(focus=false){
 if(pramaPanel.open)paintPramaPanel();else if(route==='prama')render();
 const root=pramaPanel.open?pramaPanel:$('#main'),log=root?.querySelector('.prama-thread');
 if(log)log.scrollTop=log.scrollHeight;
 if(focus)root?.querySelector('[data-prama-draft]')?.focus({preventScroll:true});
};
function generalPramaReply(question){
 if(/^(halo|hai|selamat|pagi|siang|sore|malam|hei)\b/i.test(question))return 'Halo! Apa yang ingin Anda bicarakan hari ini? Anda bisa bertanya, berbagi ide, atau meminta bantuan menyusun sesuatu.';
 if(/terima kasih|makasih/i.test(question))return 'Sama-sama. Ada yang ingin dilanjutkan atau dibahas dari sudut lain?';
 if(/surat|email|undangan/i.test(question))return 'Bisa. Agar drafnya sesuai, sebutkan penerima, tujuan, informasi yang perlu disampaikan, dan gaya bahasa yang Anda inginkan. Contoh susunan awal: salam pembuka, tujuan pesan, rincian atau jadwal, tindakan yang diharapkan, lalu penutup.';
 if(/waktu|sibuk|prioritas|produktif|keluarga/i.test(question))return 'Mulai dengan menuliskan kegiatan yang perlu dilakukan hari ini. Pilih satu sampai tiga yang paling penting, tentukan waktu mengerjakannya, lalu sisakan ruang untuk istirahat. Jika Anda menceritakan jadwal dan batas waktunya, kita bisa menyusun urutan yang lebih realistis.';
 if(/ide|inspirasi|brainstorm/i.test(question))return 'Mari mulai dari tujuan dan orang yang ingin Anda jangkau. Sebutkan tema, siapa yang terlibat, dan batasan waktu atau biaya. Kita bisa mengembangkan beberapa pilihan, lalu memilih yang paling sesuai.';
 if(/hujan|siklus air/i.test(question))return 'Hujan terbentuk ketika uap air di udara mendingin dan mengembun menjadi butiran air di awan. Butiran itu bergabung, membesar, lalu jatuh ketika cukup berat. Air yang sampai di tanah kemudian dapat mengalir, meresap, atau menguap kembali.';
 if(/lkpd|perangkat ajar|rpp|modul ajar|pembelajaran/i.test(question))return 'Bisa. Ceritakan jenjang, topik, tujuan, dan bentuk bantuan yang dibutuhkan. Jika ingin memakai catatan kelas atau melanjutkan perangkat yang sudah ada, buka folder kelas terkait agar konteksnya tepat.';
 return 'Pesan Anda sudah tersimpan di pembahasan umum. Pada prototipe ini, jawaban untuk topik tersebut belum tersedia karena Prama belum terhubung ke layanan AI. Anda tetap dapat menulis pertanyaan tentang topik apa pun dan menyimpan percakapannya di sini.';
}
const askPramaWithinClass=askPrama;
askPrama=function(question){
 const thread=currentPrama(),q=String(question||'').trim();if(!q)return;
 if(thread.classId){askPramaWithinClass(q);return;}
 const message={id:crypto.randomUUID(),question:q,date:new Date().toISOString(),sources:[],summary:generalPramaReply(q),context:'general'};
 thread.messages.push(message);thread.draft='';persist();refreshPrama(true);
};
document.addEventListener('click',event=>{
 const promptEl=event.target.closest('[data-prama-prompt]');
 if(promptEl){
  const prompt=promptEl.getAttribute('data-prama-prompt');
  const root=pramaPanel?.open?pramaPanel:document;
  const draft=root.querySelector('[data-prama-draft]');
  if(draft)draft.value=prompt;
  askPrama(prompt);
  return;
 }
 const element=event.target.closest('[data-w]');if(!element)return;const action=element.dataset.w,value=element.dataset.value;
 if(action==='prama-folder-menu')openModal('Folder & percakapan',pramaFoldersMarkup(),btn('Tutup','close'));
 else if(action==='prama-new-in-folder')newPramaConversation(value);
 else if(action==='prama-open-general'){
  const thread=pramaStore().threads.find(t=>t.folderId==='general');
  if(thread)pramaStore().active=thread.id;else startPrama();
  persist();closeModal();refreshPrama(true);
 }else if(action==='prama-open-thread'){
  const thread=pramaStore().threads.find(t=>t.id===value);if(!thread)return;
  if(recognition){recognition.stop();recognition=null;}
  pramaStore().active=thread.id;persist();closeModal();refreshPrama(true);
 }
});
document.addEventListener('toggle',event=>{
 const classId=event.target.dataset?.classFolder;if(!classId)return;
 const data=pramaStore();
 data.openFolders=event.target.open?[...new Set([...data.openFolders,classId])]:data.openFolders.filter(id=>id!==classId);
 persist();
},true);
document.addEventListener('keydown',event=>{
 if(event.target.matches('[data-prama-draft]')&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){
  event.preventDefault();event.target.closest('form')?.requestSubmit();
 }
});
