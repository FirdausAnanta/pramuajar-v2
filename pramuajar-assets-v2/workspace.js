const W={filters:{q:'',type:'',scope:'',level:'',subject:'',diff:''},tab:'students',journalTab:'entries',journalFilters:{classId:'',subject:'',from:'',to:'',status:''},editingJournal:null,importRows:null,importPreview:null,adminDraft:null};
const wh=escapeHTML;
const wb=(label,action,value='',cls='')=>`<button type="button" class="btn ${cls}" data-w="${action}" data-value="${wh(value)}">${label}</button>`;
const uid=prefix=>prefix+'-'+crypto.randomUUID();
const today=()=>new Date().toLocaleDateString('en-CA');
const wOptions=(values,selected,empty)=>`${empty!==undefined?`<option value="">${wh(empty)}</option>`:''}${values.map(v=>`<option value="${wh(v)}" ${v===selected?'selected':''}>${wh(v)}</option>`).join('')}`;
function workspaceData(){
 state.templates??=[];
 state.templates=state.templates.map(t=>({...t,scope:t.scope||'single',price:Number.isInteger(t.price)?t.price:0,file:t.file||{name:`${t.id||'template'}.pdf`,type:'application/pdf',size:0,demo:true},thumbnail:t.thumbnail||{name:`${t.id||'template'}-thumbnail.png`,type:'image/png',size:0,demo:true}}));
 for(const seed of starterTemplates)if(!state.templates.some(t=>t.id===seed.id))state.templates.push(structuredClone(seed));
 state.templatePurchases??=[];state.rosters??={};state.studentNotes??=[];state.journals??=[];state.groups??={};
 if(state.entryMode==='demo'){
   const c1=state.classes?.[0];
   if(c1&&window.PramuCore?.rosterKey){
     const rKey=PramuCore.rosterKey(c1,state.profile.year);
     state.rosterLinks??={};
     state.rosterLinks[JSON.stringify([c1.id,state.profile.year])]=rKey;
     if(!state.rosters[rKey]||!state.rosters[rKey].length){
       state.rosters[rKey]=[
         {id:'student-seed-1',name:'Aisyah Putri Ramadhani',nis:'20260101',number:'01',active:true},
         {id:'student-seed-2',name:'Bima Satria Wicaksono',nis:'20260102',number:'02',active:true},
         {id:'student-seed-3',name:'Citra Dewi Anggraini',nis:'20260103',number:'03',active:true},
         {id:'student-seed-4',name:'Dimas Aditya Pratama',nis:'20260104',number:'04',active:true},
         {id:'student-seed-5',name:'Eka Nur Fadilah',nis:'20260105',number:'05',active:true}
       ];
     }
     if(!state.journals.length){
       state.journals=[{
         id:'journal-seed-1',
         classId:c1.id,
         className:c1.name,
         school:c1.school,
         subject:c1.subject,
         year:state.profile.year,
         date:today(),
         meeting:'Pertemuan 1',
         topic:'Operasi Penjumlahan Pecahan Berpenyebut Berbeda',
         objective:'Siswa dapat menentukan KPK penyebut dan menjumlahkan dua pecahan secara mandiri dengan alat peraga konkret.',
         method:'Eksplorasi Konkret & Pembelajaran Berdiferensiasi Kelompok',
         result:'Sebagian besar siswa memahami model visual balok pecahan. 5 siswa memerlukan bimbingan tambahan dalam menyamakan penyebut.',
         evaluation:'Alat peraga visual balok pecahan mempercepat pemahaman konsep dasar sebelum perhitungan formal.',
         followup:'Sediakan kartu tantangan mandiri untuk kelompok yang sudah tuntas dan bimbingan terfokus untuk kelompok penguatan.',
         differentiation:'Kelompok konkret menggunakan balok pecahan; kelompok semi-konkret menggunakan kartu diagram; kelompok abstrak menyelesaikan soal cerita penerapan.',
         delivery:'Terlaksana',
         status:'confirmed',
         version:1,
         history:[],
         attachments:[],
         created:new Date().toISOString(),
         updated:new Date().toISOString(),
         confirmedAt:new Date().toISOString()
       }];
     }
   }
 }
}
let storageWarned=false;
function storeWorkspace(){try{const raw=JSON.stringify(state);localStorage.setItem(STORE,raw);if(raw.length>3.5e6&&!storageWarned){storageWarned=true;toast('Penyimpanan perangkat hampir penuh (±'+(raw.length/1e6).toFixed(1)+' MB). Unduh pekerjaan Anda atau hapus berkas template lama.')}return true}catch{toast('Penyimpanan lokal penuh. Unduh pekerjaan Anda sebelum melanjutkan.');return false}}
persist=function(){return storeWorkspace()};
function templateBy(id){workspaceData();return state.templates.find(t=>t.id===id);}
function diffLabels(diffs){return `<div class="tag-row">${diffs.map(d=>`<span class="diff-badge">${wh(d)}</span>`).join('')}</div>`;}
const templateScopeLabel=scope=>scope==='semester'?'Paket 1 semester':scope==='year'?'Paket 1 tahun':'Perangkat satuan';
const templatePriceLabel=t=>t.price>0?`${num(t.price)} PramuKoin`:'Gratis';
const hasTemplatePurchase=t=>state.templatePurchases.some(p=>p.templateId===t.id&&p.version===t.version);
function safeTemplateThumbnail(t){const data=t.thumbnail?.data||'';return /^data:image\/(png|jpeg|webp);base64,/i.test(data)?data:'';}
const templateCovers = {
  'steps': 'pramuajar-assets-v2/img/template-steps-3d.jpg',
  'reading': 'pramuajar-assets-v2/img/template-reading-3d.png',
  'choice': 'pramuajar-assets-v2/img/template-choice-3d.png',
  'pairs': 'pramuajar-assets-v2/img/template-pairs-3d.png',
  'concrete': 'pramuajar-assets-v2/img/template-concrete-3d.png',
  'space': 'pramuajar-assets-v2/img/template-space-3d.png',
  'slides': 'pramuajar-assets-v2/img/template-slides-3d.png',
  'semester-core': 'pramuajar-assets-v2/img/semester-icon.jpg',
  'year-core': 'pramuajar-assets-v2/img/year-plan-3d.jpg'
};
function templatePaper(t){
  const customThumbnail = safeTemplateThumbnail(t);
  const coverImg = customThumbnail || templateCovers[t.id] || 'pramuajar-assets-v2/img/template-steps-3d.jpg';
  const scopeBadgeClass = t.scope === 'year' ? 'badge-purple' : t.scope === 'semester' ? 'badge-amber' : 'badge-cyan';
  const isPaid = t.price > 0;
  return `<div class="template-card-visual">
    <img src="${wh(coverImg)}" alt="${wh(t.title)}" class="template-cover-img" loading="lazy">
    <div class="template-cover-overlay">
      <span class="template-scope-badge ${scopeBadgeClass}">${wh(templateScopeLabel(t.scope))}</span>
      <span class="template-price-badge ${isPaid ? 'price-paid' : 'price-free'}">${isPaid ? num(t.price) + ' PramuKoin' : 'Gratis'}</span>
    </div>
  </div>`;
}
function templateCard(t){
  const owned = hasTemplatePurchase(t);
  return `<article class="panel template-card" data-template-card="${wh(t.id)}">
    ${templatePaper(t)}
    <div class="template-card-content">
      <h2 style="font-size:16px;font-weight:700;line-height:1.35;margin:0 0 6px 0">${wh(t.title)}</h2>
      <p style="font-size:13px;line-height:1.55;color:var(--muted);margin:0 0 12px 0">${wh(t.need)}</p>
      <p class="file-meta" style="font-size:12px;margin:0 0 10px 0">${icon('book')} ${wh(t.file?.name||'Berkas')} · <span style="font-weight:600">${wh(t.types.join(' / '))}</span></p>
      ${diffLabels(t.diffs)}
      <div class="row wrap" style="margin-top:16px;padding-top:12px;border-top:1px solid var(--line)">
        ${wb(owned?'Unduh file':t.price>0?'Beli template':'Ambil gratis',owned?'download-template-file':'use-template',t.id,'primary')}
        ${wb('Lihat rincian','preview-template',t.id,'text')}
      </div>
    </div>
  </article>`;
}
function templatesView(){
  workspaceData();
  return `<section class="template-hero-banner">
    <div class="template-hero-text">
      <h1>Katalog Template Diferensiasi</h1>
      <p>Format siap pakai yang dirancang untuk pembelajaran berdiferensiasi. Pilih, telaah adaptasi konten, proses, dan produknya, lalu gunakan di kelas Anda.</p>
      <div class="template-pillars-row">
        <span class="pillar-tag tag-emerald">Diferensiasi Konten</span>
        <span class="pillar-tag tag-cyan">Diferensiasi Proses</span>
        <span class="pillar-tag tag-purple">Diferensiasi Produk</span>
        <span class="pillar-tag tag-amber">Lingkungan Belajar</span>
      </div>
    </div>
  </section>
  <section class="panel" style="margin-bottom:20px">
    <div class="catalog-filters">
      <label class="field">Cari template
        <input id="template-search" type="search" maxlength="100" placeholder="Coba: bacaan, bertahap, satu semester…" value="${wh(W.filters.q)}">
      </label>
      <label class="field">Rentang
        <select data-filter="scope">${wOptions(['single','semester','year'],W.filters.scope,'Semua rentang').replace('>single<','>Perangkat satuan<').replace('>semester<','>Paket 1 semester<').replace('>year<','>Paket 1 tahun<')}</select>
      </label>
      <label class="field">Jenis perangkat
        <select data-filter="type">${wOptions(PramuCore.TYPES,W.filters.type,'Semua jenis')}</select>
      </label>
      <label class="field">Jenjang
        <select data-filter="level">${wOptions(['SD','SMP'],W.filters.level,'SD & SMP')}</select>
      </label>
      <label class="field">Mata pelajaran
        <select data-filter="subject">${wOptions(['Matematika','Bahasa Indonesia'],W.filters.subject,'Semua mapel')}</select>
      </label>
    </div>
    <strong class="small" style="display:block;margin:12px 0 8px 0">Filter Pilar Diferensiasi:</strong>
    <div class="diff-filters" aria-label="Filter diferensiasi">
      ${['',...PramuCore.DIFFS].map(d=>`<button data-w="filter-diff" data-value="${d}" aria-pressed="${W.filters.diff===d}">${d||'Semua diferensiasi'}</button>`).join('')}
    </div>
    <p class="field-note" style="margin-top:10px">Konten: bahan berbeda · Proses: cara dan bantuan berbeda · Produk: bentuk hasil berbeda · Lingkungan: suasana dan ruang berbeda.</p>
  </section>
  <div id="catalog-results">${catalogResults()}</div>
  <p class="private-notice">Harga ditentukan admin. File gratis tidak memakai koin. File berbayar selalu menampilkan biaya sebelum saldo dipotong. Koleksi demo bukan materi resmi untuk semua topik.</p>`;
}
function catalogResults(){const list=PramuCore.filterTemplates(state.templates,W.filters);return `<p class="catalog-count" role="status">${list.length} template ditemukan ${wb('Hapus filter','clear-filters','','text')}</p>${list.length?`<div class="catalog-grid">${list.map(templateCard).join('')}</div>`:`<section class="panel workspace-empty"><h2>Belum ada template yang cocok.</h2><p>Coba kurangi filter atau cari berdasarkan kebutuhan, seperti “bertahap”.</p>${wb('Tampilkan semua template','clear-filters','','primary')}</section>`}`;}
function previewTemplate(id){const t=templateBy(id);if(!t)return;const owned=hasTemplatePurchase(t);openModal(wh(t.title),`${templatePaper(t)}<div class="purchase-summary"><p><strong>${wh(templateScopeLabel(t.scope))}</strong> · ${wh(t.types.join(' / '))}</p><p>${wh(t.file?.name||'Berkas template')} · ${t.file?.size?Math.ceil(t.file.size/1024)+' KB':'file contoh demo'}</p><p class="template-price-large">${owned?'Sudah dimiliki':wh(templatePriceLabel(t))}</p></div>${diffLabels(t.diffs)}${t.diffs.map(d=>`<div class="diff-detail"><strong>Diferensiasi ${wh(d)}</strong><p>${wh(t.adaptations[d])}</p></div>`).join('')}<p class="field-note">Template adalah file siap pakai. Guru tetap meninjau dan menyesuaikan isinya sebelum digunakan.</p>`,wb(owned?'Unduh file':t.price>0?'Beli template':'Ambil gratis',owned?'download-template-file':'use-template',id,'primary')+btn('Tutup','close'));}
function useTemplate(id){const t=templateBy(id);if(!t||t.status!=='published')return toast('Template ini belum tersedia.');if(hasTemplatePurchase(t))return downloadTemplateFile(id);const source=state.source==='school'&&state.schoolConnected?'school':'personal',availableBalance=source==='school'?Math.min(state.allocation,state.schoolBalance):state.personal;openModal(t.price>0?'Tinjau pembelian':'Ambil template gratis',`<div class="purchase-review">${templatePaper(t)}<div><h3>${wh(t.title)}</h3><p>${wh(templateScopeLabel(t.scope))} · ${wh(t.types.join(', '))}</p><p class="template-price-large">${wh(templatePriceLabel(t))}</p>${t.price>0?`<label class="field">Gunakan saldo<select id="template-payment-source"><option value="personal" ${source==='personal'?'selected':''}>Pribadi · ${num(state.personal)} koin</option>${state.schoolConnected?`<option value="school" ${source==='school'?'selected':''}>Sekolah · ${num(Math.min(state.allocation,state.schoolBalance))} koin</option>`:''}</select></label><p class="field-note">Saldo tersedia saat ini: ${num(availableBalance)} koin. Biaya hanya dipotong satu kali.</p>`:'<p class="field-note">Tidak ada PramuKoin yang dipotong.</p>'}</div></div>`,btn('Batal','close')+wb(t.price>0?`Beli · ${num(t.price)} PramuKoin`:'Tambahkan ke Perangkat Saya','confirm-template-purchase',id,'primary'));
}
function confirmTemplatePurchase(id){const t=templateBy(id);if(!t||t.status!=='published')return;if(hasTemplatePurchase(t)){closeModal();return downloadTemplateFile(id)}const source=$('#template-payment-source')?.value||'personal',availableBalance=source==='school'&&state.schoolConnected?Math.min(state.allocation,state.schoolBalance):state.personal;if(availableBalance<t.price)return toast('Saldo PramuKoin belum cukup.');const before={personal:state.personal,allocation:state.allocation,schoolBalance:state.schoolBalance,transactions:[...state.transactions],purchases:[...state.templatePurchases]};if(t.price>0){if(source==='school'){state.allocation-=t.price;state.schoolBalance-=t.price}else state.personal-=t.price;state.transactions.unshift({title:'Template · '+t.title,amount:-t.price,source,date:new Date().toISOString()});}state.templatePurchases.push({id:uid('purchase'),templateId:t.id,version:t.version,title:t.title,price:t.price,source:t.price>0?source:'free',purchasedAt:new Date().toISOString()});if(!storeWorkspace()){state.personal=before.personal;state.allocation=before.allocation;state.schoolBalance=before.schoolBalance;state.transactions=before.transactions;state.templatePurchases=before.purchases;return}closeModal();render();toast(t.price>0?'Template dibeli dan masuk ke Perangkat Saya.':'Template gratis masuk ke Perangkat Saya.');}
function purchasedTemplate(purchase){const t=templateBy(purchase.templateId);if(!t)return null;if(t.version===purchase.version)return t;const version=t.versions?.find(v=>v.version===purchase.version);if(version)return version;if(t.lastPublished?.version===purchase.version)return t.lastPublished;return null;}
function demoPdf(t){const lines=[t.title,templateScopeLabel(t.scope),t.types.join(' / '),'',...(t.sections||[]).flatMap(s=>[s.title,s.text.slice(0,280),''])].map(x=>String(x).replace(/[^\x20-\x7E]/g,' ').replace(/[()\\]/g,'\\$&'));const stream=['BT','/F1 12 Tf','50 790 Td',...lines.slice(0,34).flatMap((line,i)=>[i?'0 -20 Td':'',`(${line}) Tj`]).filter(Boolean),'ET'].join('\n');const objects=[`1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,`2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj`,`4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,`5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`];let pdf='%PDF-1.4\n',offsets=[0];for(const object of objects){offsets.push(pdf.length);pdf+=object+'\n'}const xref=pdf.length;pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([pdf],{type:'application/pdf'});}
function downloadPurchasedAsset(purchase){const t=purchasedTemplate(purchase);if(!t)return toast('Versi file tidak ditemukan. Hubungi admin untuk memulihkan arsip template.');let url;if(t.file?.data)url=t.file.data;else url=URL.createObjectURL(demoPdf(t));const anchor=document.createElement('a');anchor.href=url;anchor.download=t.file?.name||`${t.id}.pdf`;anchor.click();if(!t.file?.data)setTimeout(()=>URL.revokeObjectURL(url),1500);toast('File template disiapkan. Periksa folder unduhan browser.');}
function downloadTemplateFile(id){const t=templateBy(id),purchase=state.templatePurchases.find(p=>p.templateId===id&&p.version===t?.version);if(!purchase)return toast('Ambil atau beli template terlebih dahulu.');downloadPurchasedAsset(purchase);}
const baseLibraryView=library;
function purchasedFileCard(p){const t=purchasedTemplate(p);return `<article class="purchased-file"><div><span class="small muted">${wh(t?templateScopeLabel(t.scope):'Versi tersimpan')} · Versi ${p.version}</span><strong>${wh(p.title)}</strong><p>${wh(t?.file?.name||'Berkas tidak tersedia')} · ${p.price>0?num(p.price)+' PramuKoin':'Gratis'}</p></div>${t?wb('Unduh file','download-purchase',p.id,'primary'):''}</article>`;}
library=function(){
  workspaceData();
  const base=baseLibraryView();
  const totalPlans = state.plans.length;
  const readyPlans = state.plans.filter(p=>p.published).length;
  const draftPlans = totalPlans - readyPlans;
  const purchases=state.templatePurchases.slice().reverse();
  const ribbon = `<div class="classes-stats-ribbon" style="margin:16px 0 20px 0">
    <div class="class-stat-box stat-cyan">
      <span class="stat-num">${totalPlans}</span>
      <span class="stat-lbl">Total Rencana</span>
    </div>
    <div class="class-stat-box stat-emerald">
      <span class="stat-num">${readyPlans}</span>
      <span class="stat-lbl">Siap Digunakan</span>
    </div>
    <div class="class-stat-box stat-amber">
      <span class="stat-num">${draftPlans}</span>
      <span class="stat-lbl">Draf Peninjauan</span>
    </div>
  </div>`;
  const content=purchases.length?`<div class="stack" style="gap:10px">${purchases.map(purchasedFileCard).join('')}</div>`:`<div class="workspace-empty"><p>Belum ada file template. Template yang diambil dari katalog akan tersimpan di sini.</p>${btn('Buka katalog template','nav','templates','primary')}</div>`;
  return base.replace('</p></div></div><div class="document-list">', `</p></div></div>${ribbon}<div class="document-list">`) +
    `<section class="panel purchased-library" style="margin-top:24px">
      <div class="section-head" style="margin-bottom:14px">
        <div>
          <h2 style="margin:0">File Template Tersimpan</h2>
          <p class="field-note" style="margin:2px 0 0 0">Template gratis dan berbayar yang sudah Anda tambahkan ke koleksi.</p>
        </div>
        ${btn('Cari template lain','nav','templates','text')}
      </div>
      ${content}
    </section>`;
};
const baseDocSections=docSections;
docSections=function(p,m,type){
 let sections=p.templateSnapshot?.types.includes(type)?[{title:'Tujuan pembelajaran',text:m.objective},...p.templateSnapshot.sections.slice(1).map(s=>({...s}))]:baseDocSections(p,m,type);
 if(p.templateSnapshot?.types.includes(type))sections=sections.map((s,i)=>({...s,text:m.notes?.[type]?.[i]??s.text}));
 const diffs=p.differentiations||['Proses'];
 for(const d of diffs){const index=sections.length,base=p.templateSnapshot?.adaptations[d]||defaultAdaptation(d,p,m);sections.push({title:'Diferensiasi '+d,text:m.notes?.[type]?.[index]??base});}
 return sections;
};
function defaultAdaptation(d,p,m){if(d==='Proses')return `Bantuan awal: ${p.needs.base}\nLatihan penguatan: ${p.needs.middle}\nTantangan: ${p.needs.advanced}\nPeriksa satu tugas penerapan pada ${m.topic}. Siswa dapat berpindah bantuan berdasarkan jawaban, bukan kategori tetap.`;const template=starterTemplates.find(t=>t.diffs.includes(d));return template.adaptations[d];}
function differentiationReady(p){return p.meetings.every(m=>p.docs.every(type=>docSections(p,m,type).some(s=>s.title.startsWith('Diferensiasi ')&&s.text.trim().length>=40)));}
const baseResult=result;
result=function(){const p=getPlan();if(!p)return baseResult();if(!p.docs.includes(docType))docType=p.docs[0];let html=baseResult();html=html.replace('Ceritakan yang berhasil dan yang masih perlu dibantu.','Catat metode, hasil, dan evaluasi yang benar-benar terjadi.').replace(/data-action="reflect-plan"/g,'data-w="journal-from-plan"').replace('Isi refleksi','Catat pembelajaran');
 const m=p.meetings[selectedMeeting];const tools=lessonResultActions(p,m)+`<section class="panel" style="margin-bottom:20px"><div class="row between wrap"><div><strong>Penyesuaian belajar</strong><p class="field-note">${p.templateSnapshot?'Salinan template versi '+p.templateSnapshot.version+'. Perubahan admin tidak mengubah isi Anda.':'Usulan bantuan, bukan penilaian kemampuan siswa.'}</p>${diffLabels(p.differentiations||['Proses'])}</div><div class="row wrap">${wb('Tambah perangkat lain','add-type')}${p.templateSnapshot?wb('Sesuaikan dengan AI simulasi','template-ai'):''}${docType==='LKPD'?wb('Nama siswa / kelompok','lkpd-recipients'):''}</div></div><p class="field-note">Periksa isi diferensiasi di setiap perangkat sebelum menandai siap digunakan.</p></section>`;
 html=html.replace('<div class="document-layout">',tools+'<div class="document-layout">');if(docType==='LKPD')html=html.replace('<div class="doc-meta">',`${recipientMarkup(m)}<div class="doc-meta">`);return html;};
const baseSaveDoc=saveDoc;
saveDoc=function(){const p=getPlan();const changed=p&&$$('[data-doc-edit]').some(e=>p.meetings[selectedMeeting].notes?.[docType]?.[e.dataset.docEdit]!==e.value);baseSaveDoc();if(changed){p.published=false;persist()}};
function recipientMarkup(m){return m.recipients?.length?`<div class="student-snapshot">${m.recipients.map(r=>`<strong>${wh(r.label)}</strong>${r.names.length?'<br>'+r.names.map(wh).join(', '):''}`).join('<br><br>')}<br><span class="small muted">Salinan nama saat dipilih. Perubahan daftar siswa tidak mengubah perangkat ini.</span></div>`:'';}
function reviewPublish(){const p=getPlan();if(!p)return;if(p.published){p.published=false;persist();render();return}if(!differentiationReady(p))return openModal('Lengkapi penyesuaian belajar','<p>Ada perangkat yang bagian diferensiasinya kosong atau terlalu singkat. Lengkapi contoh bantuan dan pelaksanaannya. Draf tetap tersimpan dan dapat diunduh.</p>',btn('Kembali menyunting','close','','primary'));openModal('Sudah ditinjau untuk digunakan?',`<p>${p.meetings.length} pertemuan · ${p.docs.map(wh).join(', ')}.</p><p>Periksa tujuan, isi, jawaban, serta variasi bantuan di setiap perangkat. Pemeriksaan otomatis hanya memeriksa kelengkapan bagian, bukan menjamin mutu pembelajaran.</p><label class="check"><input id="teacher-reviewed" type="checkbox">Saya sudah meninjau semua perangkat dalam rencana ini.</label>`,btn('Kembali','close')+wb('Tandai siap digunakan','confirm-ready','','primary'));}
function addDocumentType(){const p=getPlan(),availableTypes=PramuCore.TYPES.filter(x=>!p.docs.includes(x));openModal('Tambahkan perangkat secara manual',`<p>Menambah struktur draf gratis. Guru menyesuaikan isi; tidak ada pembuatan AI.</p><div class="stack">${availableTypes.length?availableTypes.map(t=>wb(t,'add-type-confirm',t)).join(''):'Semua jenis perangkat sudah ada.'}</div>`);}
function templateAI(){const p=getPlan();openModal('Buat draf baru dengan AI simulasi',`<p>Salinan manual Anda tetap tersimpan. Simulasi akan memakai contoh terstruktur untuk ${p.docs.map(wh).join(', ')} dan ${p.meetings.length} pertemuan.</p><p>Isi template kustom tidak dipahami oleh AI sungguhan. Tinjau hasil contoh dan biaya sebelum membuat draf baru.</p>`,btn('Batal','close')+wb('Tinjau pengaturan & biaya','template-ai-start','','primary'));}
function initWorkspaceNavigation(){navItems.splice(0,navItems.length,['home','home','Beranda'],['classes','users','Kelas & Siswa'],['library','book','Perangkat Saya'],['journal','calendar','Jurnal Pembelajaran'],['templates','layers','Template'],['prama','chat','Prama']);}
const baseShell=shell;
shell=function(content){return baseShell(content).replace(navLink('profile','settings','Profil & pengaturan'),navLink('profile','settings','Profil & pengaturan')+navLink('admin','settings','Admin template · demo')).replace(/<nav class="mobile-nav"[\s\S]*?<\/nav>/,`<nav class="mobile-nav" aria-label="Navigasi cepat">${navLink('home','home','Beranda')}${navLink('classes','users','Kelas')}${navLink('library','book','Perangkat')}${navLink('journal','calendar','Jurnal')}<button data-w="more-nav" aria-label="Menu lainnya">${icon('menu')}<span>Lainnya</span></button></nav>`);};
document.addEventListener('click',e=>{const el=e.target.closest('[data-w]');if(!el)return;const a=el.dataset.w,v=el.dataset.value;
 if(a==='filter-diff'){W.filters.diff=v;render()}
 else if(a==='clear-filters'){W.filters={q:'',type:'',scope:'',level:'',subject:'',diff:''};render()}
 else if(a==='preview-template')previewTemplate(v);
 else if(a==='use-template')useTemplate(v);
 else if(a==='confirm-template-purchase')confirmTemplatePurchase(v);
 else if(a==='download-template-file')downloadTemplateFile(v);
 else if(a==='download-purchase'){const purchase=state.templatePurchases.find(p=>p.id===v);if(purchase)downloadPurchasedAsset(purchase);}
 else if(a==='more-nav')openModal('Menu lainnya',`<div class="stack">${btn('Template','modal-nav','templates')}${btn('Prama','modal-nav','prama')}${btn('PramuKoin','modal-nav','wallet')}${btn('Profil & pengaturan','modal-nav','profile')}${btn('Admin template · demo','modal-nav','admin')}</div>`);
 else if(a==='confirm-ready'){if(!$('#teacher-reviewed').checked)return toast('Konfirmasikan tinjauan Anda terlebih dahulu.');const p=getPlan();if(!differentiationReady(p))return;p.published=true;p.reviewedAt=new Date().toISOString();persist();closeModal();render();toast('Siap digunakan. Tidak dikirim ke sekolah.');}
 else if(a==='add-type')addDocumentType();
 else if(a==='add-type-confirm'){const p=getPlan();if(PramuCore.TYPES.includes(v)&&!p.docs.includes(v)){p.docs.push(v);p.published=false;persist();docType=v;}closeModal();render();}
 else if(a==='template-ai')templateAI();
 else if(a==='template-ai-start'){const p=getPlan();closeModal();newBuilder(p.scope,0,p.classId);builder.docs=[...p.docs];builder.count=p.meetings.length;builder.rows=structuredClone(p.meetings).map(m=>({...m,notes:{},recipients:undefined}));builder.topic=p.meetings[0].topic;builder.differentiations=[...(p.differentiations||['Proses'])];builderStep=2;render();}
});
document.addEventListener('input',e=>{if(e.target.id==='template-search'){W.filters.q=e.target.value;$('#catalog-results').innerHTML=catalogResults();}});
document.addEventListener('change',e=>{if(e.target.dataset.filter){W.filters[e.target.dataset.filter]=e.target.value;render()}});
document.addEventListener('click',e=>{if(e.target.closest('[data-action=publish]')){e.stopImmediatePropagation();saveDoc();reviewPublish()}},true);
initWorkspaceNavigation();workspaceData();
