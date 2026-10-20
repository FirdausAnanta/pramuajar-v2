function lessonPeriodMatches(record, plan=null){
 const year=record.year||plan?.year||state.profile.year;
 const semester=record.semester||plan?.meetings[record.meetingIndex]?.semester||state.profile.semester;
 return year===state.profile.year&&semester===state.profile.semester;
}
function confirmedLessonJournal(entry){
 return state.journals.filter(j=>j.classId===entry.plan.classId&&j.status==='confirmed'&&j.delivery==='Terlaksana'&&lessonPeriodMatches(j,state.plans.find(p=>p.id===j.planId)))
  .filter(j=>(j.planId===entry.plan.id&&j.meetingIndex===entry.index)||Number(j.meeting)===Number(entry.meeting.number))
  .sort((a,b)=>(b.confirmedAt||b.updated||b.date).localeCompare(a.confirmedAt||a.updated||a.date))[0]||null;
}
function classLessonFlow(classId){
 workspaceData();
 const entries=new Map();
 state.plans.filter(p=>p.classId===classId&&(p.year||state.profile.year)===state.profile.year).forEach(plan=>{
  plan.meetings.forEach((meeting,index)=>{
   if((meeting.semester||state.profile.semester)!==state.profile.semester)return;
   const key=Number(meeting.number),previous=entries.get(key);
   if(!previous||(plan.created||'')>=(previous.plan.created||''))entries.set(key,{plan,meeting,index});
  });
 });
 const lessons=[...entries.values()].sort((a,b)=>Number(a.meeting.number)-Number(b.meeting.number));
 const journals=state.journals.filter(j=>j.classId===classId&&lessonPeriodMatches(j,state.plans.find(p=>p.id===j.planId)));
 const confirmed=journals.filter(j=>j.status==='confirmed'&&j.delivery==='Terlaksana').sort((a,b)=>Number(b.meeting)-Number(a.meeting)||(b.confirmedAt||b.updated||b.date).localeCompare(a.confirmedAt||a.updated||a.date));
 const last=confirmed[0]||null;
 const pending=lessons.find(entry=>!confirmedLessonJournal(entry))||null;
 const draft=journals.filter(j=>j.status==='draft'&&j.evaluationFlow).sort((a,b)=>(b.updated||'').localeCompare(a.updated||''))[0]||null;
 const builderDraft=state.builderDraft?.classId===classId?state.builderDraft:null;
 const nextNumber=pending?Number(pending.meeting.number):last?Number(last.meeting)+1:1;
 const stale=!!(pending&&last&&Number(last.meeting)<Number(pending.meeting.number)&&(pending.plan.evaluationId!==last.id||pending.plan.evaluationSnapshot?.journalVersion!==last.version));
 return {lessons,journals,confirmed,last,pending,draft,builderDraft,nextNumber,stale};
}
function lessonSequence(stage){
 const steps=[
  {label:'Siapkan perangkat',color:'step-cyan',badge:'1'},
  {label:'Mengajar',color:'step-green',badge:'2'},
  {label:'Evaluasi',color:'step-amber',badge:'3'},
  {label:'Pertemuan berikutnya',color:'step-purple',badge:'4'}
 ];
 return `<ol class="lesson-sequence" aria-label="Alur pembelajaran">${steps.map((s,i)=>`<li class="${s.color} ${i===stage?'active-step':i<stage?'done-step':''}" ${i===stage?'aria-current="step"':''}><span class="seq-num" aria-hidden="true">${s.badge}</span><span class="seq-text">${s.label}</span></li>`).join('')}</ol>`;
}
function lessonJournalEvidence(j){
 const summary=j.result.length>220?j.result.slice(0,220)+'…':j.result;
 return `<div class="lesson-evidence"><p class="small muted">Evaluasi pertemuan ${wh(j.meeting)} · ${wh(j.date)}</p><p class="note-excerpt">${wh(summary)}</p><details><summary>Lihat evaluasi dan tindak lanjut</summary><p>${wh(j.evaluation)}</p><p><strong>Tindak lanjut:</strong> ${wh(j.followup)}</p></details></div>`;
}
function lessonFocus(flow){
 const {pending,last,draft,builderDraft,nextNumber,stale}=flow,c=activeClass();
 let title,description,actions,stage=0;
 if(draft){
  stage=2;title=`Lanjutkan evaluasi pertemuan ${draft.meeting||nextNumber}.`;
  description='Cerita Anda sudah menjadi draf. Periksa hasilnya untuk menyimpan jurnal dan menyiapkan pembelajaran berikutnya.';
  actions=wb('Lanjutkan evaluasi','lesson-evaluation-draft',draft.id,'primary');
 }else if(builderDraft){
  title=builderDraft.scope==='meeting'?`Lanjutkan persiapan pertemuan ${builderDraft.first}.`:'Lanjutkan rencana '+(builderDraft.scope==='year'?'satu tahun.':'satu semester.');
  description='Pengaturan dan perubahan Anda sudah tersimpan. Lanjutkan meninjau perangkat untuk kelas ini.';
  actions=btn('Lanjutkan persiapan','resume-draft','','primary');
 }else if(stale){
  stage=3;title=`Sesuaikan pertemuan ${nextNumber} dengan evaluasi.`;
  description=`Rencana ${pending.plan.scope==='year'?'tahunan':pending.plan.scope==='semester'?'semester':'awal'} untuk “${pending.meeting.topic}” sudah ada. Gunakan evaluasi pertemuan ${last.meeting} untuk memperbarui bantuannya.`;
  actions=wb('Sesuaikan dengan evaluasi','lesson-prepare',c.id,'primary')+wb('Buka rencana awal','lesson-open',c.id,'text');
 }else if(pending){
  stage=1;title=`Pertemuan ${nextNumber}: ${pending.meeting.topic}`;
  description=`${pending.plan.docs.join(', ')} sudah tersimpan${pending.plan.published?' dan ditinjau guru':'. Tinjau isi sebelum digunakan di kelas'}.`;
  actions=wb('Buka perangkat ajar','lesson-open',c.id,'primary')+wb('Sudah mengajar? Evaluasi pertemuan ini','lesson-evaluate',c.id,'text');
 }else if(last){
  stage=3;title=`Siapkan pertemuan ${nextNumber} untuk ${c.name}.`;
  description=`Evaluasi pertemuan ${last.meeting} sudah tersimpan sebagai jurnal. Bantuan pada perangkat berikutnya akan mengikuti hasil evaluasi tersebut.`;
  actions=wb('Siapkan pertemuan berikutnya','lesson-prepare',c.id,'primary');
 }else{
  title=`Siapkan pertemuan pertama untuk ${c.name}.`;
  description='Pilih topik, periksa bantuan belajar, lalu buat perangkat ajar dengan AI. Setelah mengajar, ceritakan hasilnya agar pertemuan berikutnya lebih sesuai.';
  actions=btn('Buat perangkat ajar','quick-prepare',c.id,'primary');
 }
 return `<section class="panel lesson-focus">
  <div class="focus-top-row">
   <label class="field">Kelas yang sedang dikerjakan<select id="home-class">${classOptions(c.id)}</select></label>
   <span class="live-status-pill"><span class="live-dot"></span>Kelas Aktif</span>
  </div>
  ${lessonSequence(stage)}
  <div class="lesson-focus-layout">
   <div class="lesson-focus-main">
    <p class="small muted step-kicker">Langkah berikutnya</p>
    <h2 class="focus-heading">${wh(title)}</h2>
    <p class="lead">${wh(description)}</p>
    <div class="lesson-actions">${actions}</div>
    ${last?lessonJournalEvidence(last):''}
    ${pending?.plan.evaluationId&&pending.plan.evaluationId===last?.id&&!stale?'<p class="field-note">Perangkat ini disusun berdasarkan evaluasi terakhir kelas ini.</p>':''}
    ${!pending&&!last?`<p class="field-note">Modul Ajar, RPP, LKPD, dan pilihan materi lainnya disiapkan untuk kelas yang Anda pilih.</p>`:''}
   </div>
   <div class="lesson-focus-visual" aria-hidden="true">
    <div class="focus-art-card">
     <img src="pramuajar-assets-v2/img/hero-teacher.jpg" alt="Ruang Belajar Interaktif" class="focus-hero-img">
     <div class="focus-glass-overlay">
      <div class="focus-glass-tag">Ruang Belajar Interaktif</div>
      <p class="focus-glass-sub">Berdiferensiasi · Berangkat dari kebutuhan nyata siswa</p>
     </div>
    </div>
   </div>
  </div>
 </section>`;
}
function formatGradeLabel(cl){
  if(cl.grade&&String(cl.grade).trim())return 'Kelas '+String(cl.grade).trim();
  const name=cl.name||'';
  const match=name.match(/\b(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I|\d+)\b/i);
  if(match){
    const romanMap={'I':'1','II':'2','III':'3','IV':'4','V':'5','VI':'6','VII':'7','VIII':'8','IX':'9','X':'10','XI':'11','XII':'12'};
    const val=match[1].toUpperCase();
    return 'Kelas '+(romanMap[val]||val);
  }
  return name?'Kelas '+name:'Kelas';
}

function planningOptionsPanel(){
  const active=activeClass();
  const schoolClasses=(state.classes||[]).filter(cl=>!active.school||cl.school===active.school||cl.level===active.level);
  const rawClasses=schoolClasses.length?schoolClasses:(state.classes||[active]);
  const classesToShow=rawClasses.slice().sort((a,b)=>{
    if(a.id===active.id)return -1;
    if(b.id===active.id)return 1;
    const ga=parseInt(String(a.grade).replace(/\D/g,''))||0;
    const gb=parseInt(String(b.grade).replace(/\D/g,''))||0;
    return ga-gb;
  });
  const cardImages=['pramuajar-assets-v2/img/semester-icon.jpg','pramuajar-assets-v2/img/year-plan-3d.jpg','pramuajar-assets-v2/img/template-steps-3d.jpg'];

  let cardsHtml='';
  if(classesToShow.length===1){
    const cl=classesToShow[0];
    const gradeLabel=formatGradeLabel(cl);
    const subject=cl.subject||'Mata Pelajaran';
    cardsHtml+=`
    <div class="other-option-card card-semester">
      <div class="opt-card-media">
        <img src="pramuajar-assets-v2/img/semester-icon.jpg" alt="Paket Semester" class="opt-media-img">
        <span class="opt-badge">1 Semester · ${wh(cl.name)}</span>
      </div>
      <div class="opt-card-content">
        <strong class="opt-title">Paket Perangkat Ajar ${wh(subject)} ${wh(gradeLabel)} - 1 Semester</strong>
        <p class="opt-desc">Modul Ajar, RPP, dan LKPD adaptif satu semester penuh.</p>
      </div>
      <div class="card-plan-actions">
        ${wb('Rencanakan 1 semester','plan-class-semester',cl.id,'btn-plan-primary full')}
      </div>
    </div>
    <div class="other-option-card card-year">
      <div class="opt-card-media">
        <img src="pramuajar-assets-v2/img/year-plan-3d.jpg" alt="Paket 1 Tahun" class="opt-media-img">
        <span class="opt-badge">1 Tahun Ajaran · ${wh(cl.name)}</span>
      </div>
      <div class="opt-card-content">
        <strong class="opt-title">Paket Perangkat Ajar ${wh(subject)} ${wh(gradeLabel)} - 1 Tahun</strong>
        <p class="opt-desc">Rancangan komprehensif dua semester yang dapat diperbarui.</p>
      </div>
      <div class="card-plan-actions">
        ${wb('Rencanakan 1 tahun','plan-class-year',cl.id,'btn-plan-secondary full')}
      </div>
    </div>
    <div class="other-option-card card-template">
      <div class="opt-card-media">
        <img src="pramuajar-assets-v2/img/templates-catalog-3d.jpg" alt="Katalog Template" class="opt-media-img">
        <span class="opt-badge">Katalog Siap Pakai</span>
      </div>
      <div class="opt-card-content">
        <strong class="opt-title">Katalog Template</strong>
        <p class="opt-desc">Perangkat satuan seperti LKPD atau materi ajar pilihan dari katalog template.</p>
      </div>
      <div class="card-plan-actions">
        ${btn('Pilih template','nav','templates','btn-plan-outline full')}
      </div>
    </div>`;
  } else {
    classesToShow.forEach((cl,idx)=>{
      const gradeLabel=formatGradeLabel(cl);
      const subject=cl.subject||'Mata Pelajaran';
      const img=cardImages[idx%cardImages.length];
      cardsHtml+=`
      <div class="other-option-card card-semester">
        <div class="opt-card-media">
          <img src="${img}" alt="${wh(cl.name)}" class="opt-media-img">
          <span class="opt-badge">1 Semester · ${wh(cl.name)}</span>
        </div>
        <div class="opt-card-content">
          <strong class="opt-title">Paket Perangkat Ajar ${wh(subject)} ${wh(gradeLabel)} - 1 Semester</strong>
          <p class="opt-desc">Modul Ajar, RPP, dan LKPD adaptif satu semester penuh.</p>
        </div>
        <div class="card-plan-actions">
          ${wb('Rencanakan 1 semester','plan-class-semester',cl.id,'btn-plan-primary full')}
          ${wb('Opsi rancangan 1 tahun →','plan-class-year',cl.id,'btn-plan-secondary full')}
        </div>
      </div>`;
    });
    cardsHtml+=`
    <div class="other-option-card card-template">
      <div class="opt-card-media">
        <img src="pramuajar-assets-v2/img/templates-catalog-3d.jpg" alt="Katalog Template" class="opt-media-img">
        <span class="opt-badge">Katalog Siap Pakai</span>
      </div>
      <div class="opt-card-content">
        <strong class="opt-title">Katalog Template</strong>
        <p class="opt-desc">Perangkat satuan seperti LKPD atau materi ajar pilihan dari katalog template.</p>
      </div>
      <div class="card-plan-actions">
        ${btn('Pilih template','nav','templates','btn-plan-outline full')}
      </div>
    </div>`;
  }

  return `<section class="panel other-options-panel">
   <div class="other-options-header">
    <div class="row between wrap" style="align-items:flex-start">
      <div>
        <h2>Pilih Perencanaan</h2>
        <p class="lead small">Rekomendasi paket perangkat ajar adaptif yang dipersonalisasi sesuai kelas dan mata pelajaran Anda.</p>
      </div>
      <div>
        <a href="#/classes" class="btn text small" style="font-weight:600">+ Kelola kelas</a>
      </div>
    </div>
   </div>
   <div class="other-options-grid">
    ${cardsHtml}
   </div>
  </section>`;
}

home=function(){
 const c=activeClass(),flow=classLessonFlow(c.id),note=latestNote(c.id);
 return heading('Selamat datang, '+wh(state.profile.name)+'.','Siapkan pembelajaran, ceritakan hasilnya, lalu lanjutkan sesuai kebutuhan kelas.')+
 `<div class="teaching-home"><div class="stack">
  ${planningOptionsPanel()}
  ${lessonFocus(flow)}
 </div>
 <aside class="stack lesson-sidebar">
  <section class="panel sidebar-panel">
   <div class="panel-card-head">
    <span class="panel-icon-circle">${icon('calendar')}</span>
    <div>
     <h2>Jurnal dari evaluasi Anda</h2>
     <p class="lead small">Evaluasi terkonfirmasi tersusun rapi menjadi riwayat jurnal.</p>
    </div>
   </div>
   ${flow.last?`<div class="sidebar-status-box"><span class="status-strong">Pertemuan ${wh(flow.last.meeting)} Sudah Tercatat</span><p class="small muted">Data siap untuk laporan pembelajaran.</p></div>${wb('Buka jurnal terakhir','edit-journal',flow.last.id,'text')}`:'<p class="field-note">Jurnal pertama akan muncul setelah evaluasi pembelajaran disimpan.</p>'}
   ${wb('Lihat jurnal & laporan','lesson-journals',c.id,'text')}
  </section>
  <section class="panel sidebar-panel">
   <div class="panel-card-head">
    <span class="panel-icon-circle">${icon('users')}</span>
    <div class="row between full">
     <div>
      <h2>Daftar siswa ${wh(c.name)}</h2>
      <p class="lead small">Nama untuk LKPD, kelompok, dan catatan.</p>
     </div>
     <span class="roster-badge-pill">${getRoster(c.id).filter(s=>s.active!==false).length}</span>
    </div>
   </div>
   ${btn('Kelola daftar siswa','view-class',c.id,'text')}
  </section>
  ${note?`<section class="panel sidebar-panel panel-prama-card">
   <div class="prama-card-head">
    <img src="pramuajar-assets-v2/img/prama-bot.png" alt="Prama AI" class="prama-avatar-thumbnail">
    <div>
     <span class="subtle-pill pill-amber">Catatan Kelas Terakhir${note.sample?' · contoh':''}</span>
     <time class="small muted block-time">${pramaDate(note.date)}</time>
    </div>
   </div>
   <p class="note-excerpt">${wh(note.text)}</p>
   <div class="prama-card-action">
    <button class="btn subtle small full" data-action="prama" data-value="${c.id}">
     Bicarakan saran dengan Prama
    </button>
   </div>
  </section>`:''}
 </aside></div>`;
};
function evaluationSnapshot(j){
 return {id:j.noteId||j.id,journalId:j.id,journalVersion:j.version,classId:j.classId,topic:j.topic,text:j.result,evaluation:j.evaluation,recommendation:j.followup,method:j.method,date:j.date+'T12:00:00',year:j.year,semester:j.semester,meeting:j.meeting,kind:'Evaluasi guru',sample:state.entryMode==='demo'};
}
function lessonBuilderContext(){
 const note=builder?.evaluationSnapshot;
 if(!note)return '';
 return `<section class="lesson-builder-context"><strong>Berdasarkan evaluasi pertemuan ${wh(note.meeting)} · ${wh(classBy(note.classId).name)}</strong><p>${wh(note.recommendation)}</p><details><summary>Lihat pengamatan yang digunakan</summary><p>${wh(note.text)}</p><p class="small muted">${wh(note.date.slice(0,10))} · Dikonfirmasi guru</p></details></section>`;
}
function supportFromEvaluation(j){
 const needs=structuredClone(needsFor(classBy(j.classId))),text=[j.result,j.evaluation,j.followup].join(' ').toLowerCase();
 if(/bingung|sulit|belum|konkret|gambar|abstrak|analogi/.test(text))needs.base='Mulai dari satu contoh konkret dan gambar. Pecah petunjuk menjadi langkah singkat, lalu periksa pemahaman dengan contoh baru sebelum mengurangi bantuan.';
 if(/diskusi|berpasangan|kelompok|partisipasi|kondusif/.test(text))needs.middle='Beri waktu berpikir individu, lalu diskusi berpasangan atau kelompok kecil dengan peran jelas. Akhiri dengan jawaban individu untuk memeriksa pemahaman.';
 if(/sudah|cepat|tercapai|tantangan/.test(text))needs.advanced='Bagi siswa yang sudah menunjukkan pemahaman, sediakan tantangan penerapan pada situasi baru dan minta alasan. Siswa lain tetap mendapat bantuan bertahap.';
 if(j.followup.trim())needs.base+=' Tindak lanjut guru: '+j.followup.trim();
 return needs;
}
quickPrepare=function(classId){
 const flow=classLessonFlow(classId),draft=state.builderDraft;
 const proceed=()=>{
  closeModal();state.activeClass=classId;
  const entry=flow.pending,j=flow.last;
  newBuilder('meeting',0,classId);
  builder.first=flow.nextNumber;
  if(entry){builder.topic=entry.meeting.topic;builder.chapter=entry.meeting.chapter;builder.source=entry.plan.source;builder.jp=entry.plan.jp;builder.duration=entry.plan.duration;builder.docs=[...entry.plan.docs];builder.differentiations=[...(entry.plan.differentiations||['Proses'])];}
  else if(j){builder.topic=j.topic;builder.chapter='Penguatan dan lanjutan pembelajaran';builder.differentiations=['Proses'];}
  if(j){builder.needs=supportFromEvaluation(j);builder.evaluationId=j.id;builder.evaluationSnapshot=evaluationSnapshot(j);builder.reflection=true;}
  builder.previousLesson=j?{journalId:j.id,meeting:Number(j.meeting),planId:j.planId}:null;
  builder.rows=null;state.builderDraft=structuredClone(builder);persist();render();
 };
 if(draft){
  openModal('Ada persiapan yang belum selesai',`<p>Draf untuk <strong>${wh(classBy(draft.classId).name)} · ${wh(classBy(draft.classId).subject)}</strong> masih tersimpan. Lanjutkan draf tersebut atau ganti dengan persiapan yang baru.</p>`,wb('Lanjutkan draf','lesson-resume-draft')+wb('Ganti dengan persiapan baru','lesson-replace','','primary'));
  W.replaceLessonDraft=proceed;
 }else proceed();
};
function openClassLesson(classId){
 const entry=classLessonFlow(classId).pending;
 if(!entry)return toast('Belum ada perangkat yang menunggu digunakan.');
 state.activeClass=classId;selectedPlan=entry.plan.id;selectedMeeting=entry.index;docType=entry.plan.docs[0];editing=false;persist();go('result');
}
function beginLessonEvaluation(plan=null,index=null,navigate=true){
 workspaceData();
 const flow=classLessonFlow(plan?.classId||state.activeClass),entry=plan?{plan,index:index??selectedMeeting,meeting:plan.meetings[index??selectedMeeting]}:flow.pending;
 if(entry){selectedMeeting=entry.index;state.activeClass=entry.plan.classId;journalNew(entry.plan,'','',false);}
 else journalNew(null,'','',false);
 const j=W.editingJournal;
 j.evaluationFlow=true;j.semester=entry?.meeting.semester||state.profile.semester;j.year=state.profile.year;
 if(!entry)j.meeting=flow.nextNumber;
 reflectionDraft={text:j.result||'',difficulty:[],pace:'',goal:'',recommendation:''};
 persist();if(navigate)go('journal-edit');
}
reflection=function(){
 if(!W.editingJournal?.evaluationFlow||W.editingJournal.classId!==state.activeClass)beginLessonEvaluation(null,null,false);
 return teachingEvaluationEditor();
};
function teachingEvaluationEditor(){
 const j=W.editingJournal,c=classBy(j.classId),plan=state.plans.find(p=>p.id===j.planId);
 return heading('Evaluasi pembelajaran','Ceritakan sekali. Hasilnya menjadi jurnal dan dasar pertemuan berikutnya.',btn('Kembali ke beranda','nav','home'))+
 `<div class="teaching-evaluation"><section class="panel"><form id="journal-form" novalidate><div class="stack"><div class="evaluation-context"><strong>${wh(c.name)} · ${wh(c.subject)}</strong><p>Pertemuan ${wh(j.meeting||'belum diisi')} · ${wh(j.topic||'Lengkapi topik di bawah')}</p></div><div id="journal-errors" role="alert"></div>
 ${j.status==='confirmed'?'<p class="notice">Perubahan evaluasi akan disimpan sebagai versi baru. Jurnal sebelumnya tetap ada dalam riwayat.</p>':''}
 <input type="hidden" name="classId" value="${wh(j.classId)}"><input type="hidden" id="journal-note" value="${wh(j.noteId||'')}">${(j.attachments||[]).map(id=>`<input type="hidden" name="attachments" value="${wh(id)}">`).join('')}
 <div class="form-grid"><label class="field">Tanggal mengajar<input type="date" name="date" value="${wh(j.date)}"></label><label class="field">Metode yang digunakan<input name="method" maxlength="300" placeholder="Contoh: kelompok, lalu individu" value="${wh(j.method)}"></label></div>
 ${!plan?`<div class="form-grid"><label class="field">Pertemuan ke<input type="number" name="meeting" min="1" max="500" value="${wh(j.meeting)}"></label><label class="field">Topik pembelajaran<input name="topic" maxlength="180" value="${wh(j.topic)}"></label><label class="field wide">Tujuan pembelajaran<textarea name="objective" maxlength="1800">${wh(j.objective)}</textarea></label></div>`:`<input type="hidden" name="meeting" value="${wh(j.meeting)}"><input type="hidden" name="topic" value="${wh(j.topic)}"><input type="hidden" name="objective" value="${wh(j.objective)}">`}
 <div><h2>Bagaimana pembelajaran tadi?</h2><p class="lead small">Ceritakan yang berhasil, bagian yang masih sulit, dan bantuan yang sudah dicoba.</p></div>
 <label class="field">Cerita Anda<textarea id="reflection-text" name="result" maxlength="4000" placeholder="Sebagian siswa sudah memahami konsep dengan gambar, tetapi masih bingung saat mencoba sendiri. Diskusi kelompok membantu, namun waktu latihan kurang." class="evaluation-story">${wh(j.result)}</textarea></label>
 <div class="row wrap">${btn('Ucapkan dengan suara','voice')}${btn('Gunakan contoh cerita','sample-reflection','','text')}</div><p id="voice-status" role="status" class="field-note">Periksa hasil suara sebelum menyimpan.</p>
 <details class="evaluation-details"><summary>Tambahkan kondisi kelas (opsional)</summary><div class="stack"><label class="field">Capaian tujuan<select name="goal"><option value="">Belum dicatat</option>${wOptions(['Belum terlihat','Sebagian','Mayoritas tercapai'],j.goal)}</select></label><label class="field">Kecepatan belajar<select name="pace"><option value="">Belum dicatat</option>${wOptions(['Lebih lambat','Sesuai rencana','Lebih cepat'],j.pace)}</select></label><label class="field">Diferensiasi yang dilaksanakan<textarea name="differentiation" maxlength="3000" placeholder="Contoh: petunjuk bertahap dan pilihan tugas pengayaan">${wh(j.differentiation)}</textarea></label><label class="field">Pelaksanaan<select name="delivery">${wOptions(['Terlaksana','Ditunda','Dibatalkan'],j.delivery)}</select></label></div></details>
 <details class="evaluation-details"><summary>Evaluasi dan tindak lanjut yang akan masuk jurnal</summary><p class="field-note">Cerita menjadi dasar ringkasan saat ditinjau. Anda dapat mengisi atau memperbaikinya di sini.</p><div class="stack"><label class="field">Evaluasi guru<textarea name="evaluation" maxlength="3000" placeholder="Diisi dari cerita saat Anda meninjau">${wh(j.evaluation)}</textarea></label><label class="field">Tindak lanjut<textarea name="followup" maxlength="3000" placeholder="Usulan bantuan untuk pertemuan berikutnya">${wh(j.followup)}</textarea></label></div></details>
 <div class="form-footer">${wb('Simpan draf','journal-save-draft')}${wb('Tinjau evaluasi & jurnal','journal-review','','primary')}</div><p class="field-note">Jurnal dan catatan kelas disimpan setelah Anda memeriksa serta mengonfirmasi. Tidak ada pemotongan PramuKoin untuk evaluasi.</p></div></form></section>
 <aside class="panel evaluation-explanation"><h2>Setelah evaluasi disimpan</h2><ol><li><strong>Jurnal tersusun.</strong><p>Tanggal, metode, hasil, dan tindak lanjut tersedia untuk laporan.</p></li><li><strong>Perangkat berikutnya menyesuaikan.</strong><p>Bantuan dan tantangan diusulkan berdasarkan evaluasi kelas ini.</p></li></ol><p class="field-note">Guru tetap memeriksa usulan sebelum membuat perangkat berikutnya.</p></aside></div>`;
}
const journalEditorBeforeFlow=journalEditorView;
journalEditorView=function(){return W.editingJournal?.evaluationFlow?teachingEvaluationEditor():journalEditorBeforeFlow();};
const reviewJournalBeforeFlow=reviewJournal;
reviewJournal=function(){
 if(W.editingJournal?.evaluationFlow){
  let j=readJournalForm();
  const storyKey=JSON.stringify([j.result,j.goal,j.pace]);
  if(j.autoEvaluationSource!==storyKey){
   if(j.evaluation===j.autoEvaluation)j.evaluation='';
   if(j.followup===j.autoFollowup)j.followup='';
  }
  if(j.result.trim()){
   if(!j.evaluation.trim()){j.evaluation=[j.goal?'Capaian menurut pengamatan guru: '+j.goal+'.':'',j.pace?'Kecepatan belajar: '+j.pace+'.':'',j.result].filter(Boolean).join('\n');j.autoEvaluation=j.evaluation;}
   if(!j.followup.trim()){
    const text=[j.result,j.evaluation].join(' ').toLowerCase(),suggestions=[];
    if(/bingung|sulit|belum|gambar|konkret|abstrak/.test(text))suggestions.push('Mulai dengan contoh konkret dan petunjuk bertahap, lalu periksa pemahaman melalui tugas individu.');
    if(/waktu|kurang|lambat/.test(text))suggestions.push('Utamakan latihan inti dan beri jeda untuk memeriksa pemahaman sebelum menambah tugas.');
    if(/kondusif|ramai|partisipasi|diskusi|kelompok/.test(text))suggestions.push('Gunakan diskusi berpasangan atau kelompok kecil dengan peran yang jelas.');
    if(/sudah|tercapai|cepat|tantangan/.test(text))suggestions.push('Sediakan tantangan penerapan bagi siswa yang sudah menunjukkan pemahaman.');
    j.followup=suggestions.join(' ')||'Periksa kesiapan melalui satu pertanyaan penerapan. Berikan bantuan bertahap atau tantangan sesuai respons siswa.';j.autoFollowup=j.followup;
   }
   j.autoEvaluationSource=storyKey;$('#journal-form [name=evaluation]').value=j.evaluation;$('#journal-form [name=followup]').value=j.followup;
  }
  W.editingJournal=j;
 }
 reviewJournalBeforeFlow();
};
const saveJournalBeforeFlow=saveJournal;
saveJournal=function(confirmed){
 const j=W.editingJournal,fromEvaluation=j?.evaluationFlow,id=j?.id;
 saveJournalBeforeFlow(confirmed);
 if(fromEvaluation&&!W.editingJournal&&state.journals.some(item=>item.id===id)){
  state.activeClass=j.classId;persist();go('home');toast(confirmed?'Evaluasi tersimpan. Jurnal sudah tersusun, lanjutkan ke pertemuan berikutnya.':'Draf evaluasi tersimpan. Lanjutkan dari beranda kelas ini.');
 }
};
function lessonResultActions(p,m){
 const entry={plan:p,meeting:m,index:selectedMeeting},j=confirmedLessonJournal(entry);
 return `<section class="panel lesson-result-actions"><div><h2>${j?'Evaluasi pertemuan ini sudah tersimpan.':'Setelah mengajar, evaluasi pertemuan ini.'}</h2><p>${j?'Jurnal sudah tersusun. Gunakan hasilnya untuk menyiapkan bantuan pada pertemuan berikutnya.':'Ceritakan hasil pembelajaran. Evaluasi Anda menjadi jurnal dan dasar perangkat berikutnya.'}</p></div><div class="row wrap">${j?wb('Lanjutkan ke pertemuan berikutnya','lesson-next-from-result',p.classId,'primary'):wb('Evaluasi pembelajaran','lesson-result-evaluate',p.id,'primary')}${j?wb('Lihat evaluasi & jurnal','edit-journal',j.id,'text'):''}</div></section>`;
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-w]');if(!el)return;const action=el.dataset.w,value=el.dataset.value;
 if(action==='lesson-open')openClassLesson(value);
 else if(action==='lesson-prepare')quickPrepare(value);
 else if(action==='lesson-evaluate'){const entry=classLessonFlow(value).pending;state.activeClass=value;beginLessonEvaluation(entry?.plan||null,entry?.index??null);}
 else if(action==='lesson-result-evaluate')beginLessonEvaluation(getPlan(),selectedMeeting);
 else if(action==='lesson-evaluation-draft'){W.editingJournal=structuredClone(state.journals.find(j=>j.id===value));go('journal-edit');}
 else if(action==='lesson-next-from-result'){state.activeClass=value;persist();go('home');}
 else if(action==='lesson-journals'){W.journalFilters={classId:value,subject:'',from:'',to:'',status:''};W.journalTab='entries';go('journal');}
 else if(action==='lesson-replace'){const proceed=W.replaceLessonDraft;W.replaceLessonDraft=null;if(proceed)proceed();}
 else if(action==='lesson-resume-draft'){closeModal();if(state.builderDraft){builder=structuredClone(state.builderDraft);builderStep=1;state.activeClass=builder.classId;persist();go('create');}}
 else if(action==='plan-class-semester'){state.activeClass=value;persist();newBuilder('semester',0,value);}
 else if(action==='plan-class-year'){state.activeClass=value;persist();newBuilder('year',0,value);}
});
document.addEventListener('change',e=>{
 if(e.target.id==='build-class'&&builder){
  delete builder.evaluationId;delete builder.evaluationSnapshot;delete builder.previousLesson;
  const flow=classLessonFlow(e.target.value);
  if(flow.last){builder.evaluationId=flow.last.id;builder.evaluationSnapshot=evaluationSnapshot(flow.last);}
 }
},true);
document.addEventListener('change',e=>{
 if(e.target.id==='build-class'&&builder?.evaluationSnapshot){
  const journal=state.journals.find(j=>j.id===builder.evaluationId);
  if(journal)builder.needs=supportFromEvaluation(journal);
  state.builderDraft=structuredClone(builder);persist();render();
 }
});
