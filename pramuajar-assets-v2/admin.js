function adminView(){
 workspaceData();
 return heading('Kelola template','Unggah file, sampul, rentang, dan harga sebelum template diterbitkan.',wb('Tambah template','new-template','','primary'))+
 `<div class="admin-strip"><strong>Ruang admin simulasi</strong><p>File disimpan di browser ini untuk demonstrasi. Produksi membutuhkan backend, penyimpanan berkas, autentikasi admin, dan pencatatan transaksi.</p></div>
 <section class="panel admin-workflow"><h2>Yang disiapkan admin</h2><ol><li>File utama PDF atau DOCX</li><li>Thumbnail PNG, JPG, atau WebP</li><li>Harga: gratis atau PramuKoin</li><li>Ringkasan dan bentuk diferensiasi</li></ol><details class="simple-details"><summary>Impor data template lama (.json)</summary><p class="field-note">Khusus pemindahan data demo, maksimal 200 KB. File perangkat tetap diunggah pada halaman penyuntingan.</p><div class="row wrap">${wb('Unduh contoh data','download-template-format')}<label class="field">Pilih JSON<input id="admin-upload" type="file" accept=".json,application/json"></label></div><p id="admin-upload-status" role="status"></p></details></section>
 <div class="stack">${state.templates.map(t=>`<article class="panel admin-template-card">${templatePaper(t)}<div class="admin-template-copy"><span class="small muted">${t.status==='published'?'Terbit':t.status==='archived'?'Diarsipkan':'Draf'} · Versi ${t.version} · ${wh(templateScopeLabel(t.scope))}</span><h2>${wh(t.title)}</h2><p>${wh(t.file?.name||'File belum dipilih')} · ${wh(templatePriceLabel(t))}</p>${diffLabels(t.diffs)}<div class="row wrap">${wb('Pratinjau','preview-template',t.id)}${wb('Sunting','edit-template',t.id)}${t.status!=='published'?wb('Tinjau & terbitkan','publish-template',t.id,'primary'):wb('Arsipkan','archive-template',t.id)}${wb('Riwayat','template-history',t.id,'text')}</div></div></article>`).join('')}</div>`;
}

function normalizeTemplate(t){
 return {id:uid('template'),title:String(t.title||'').slice(0,140),need:String(t.need||'').slice(0,600),level:['SD','SMP','Semua'].includes(t.level)?t.level:'Semua',subject:['Matematika','Bahasa Indonesia','Semua'].includes(t.subject)?t.subject:'Semua',scope:['single','semester','year'].includes(t.scope)?t.scope:'single',price:Number.isInteger(Number(t.price))?Number(t.price):0,types:Array.isArray(t.types)?t.types.filter(x=>PramuCore.TYPES.includes(x)):[],diffs:Array.isArray(t.diffs)?t.diffs.filter(x=>PramuCore.DIFFS.includes(x)):[],sections:Array.isArray(t.sections)?t.sections.slice(0,20).map(s=>({title:String(s.title||'').slice(0,140),text:String(s.text||'').slice(0,12000)})):[],adaptations:Object.fromEntries(PramuCore.DIFFS.map(d=>[d,String(t.adaptations?.[d]||'').slice(0,12000)])),file:t.file&&typeof t.file==='object'?structuredClone(t.file):null,thumbnail:t.thumbnail&&typeof t.thumbnail==='object'?structuredClone(t.thumbnail):null,status:'draft',version:0,origin:'Admin lokal',versions:[]};
}

function adminEdit(id='',uploaded=null){
 W.adminDraft=structuredClone(uploaded||templateBy(id)||normalizeTemplate({title:'',types:['LKPD'],diffs:['Proses'],sections:[{title:'Ringkasan isi',text:''},{title:'Yang diperoleh guru',text:''}],scope:'single',price:0}));
 go('admin-edit');
}

function adminEditorView(){
 const t=W.adminDraft;if(!t)return adminView();
 const thumbData=/^data:image\/(png|jpeg|webp);base64,/i.test(t.thumbnail?.data||'')?t.thumbnail.data:'';
 const thumb=thumbData?`<img class="admin-thumb-preview" src="${wh(thumbData)}" alt="Thumbnail yang dipilih">`:'<div class="admin-thumb-empty">Thumbnail belum dipilih</div>';
 return heading('Sunting template','File adalah produk yang diterima guru. Ringkasan membantu guru menilai kesesuaiannya.',wb('Kembali ke daftar','admin-back'))+
 `<section class="panel wide-form"><form id="admin-template-form"><div class="admin-template-fields"><div id="admin-errors" role="alert"></div>
 <section class="asset-upload-grid"><div class="upload-box"><h2>1. File template</h2><p class="field-note">PDF atau DOCX, maksimal 1 MB pada prototipe lokal.</p><label class="field">Pilih file<input name="template-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label><p id="template-file-status" role="status">${t.file?`Dipilih: ${wh(t.file.name)}${t.file.size?' · '+Math.ceil(t.file.size/1024)+' KB':''}`:'Belum ada file.'}</p></div><div class="upload-box"><h2>2. Thumbnail</h2>${thumb}<p class="field-note">PNG, JPG, atau WebP, maksimal 350 KB.</p><label class="field">Pilih gambar<input name="thumbnail-file" type="file" accept="image/png,image/jpeg,image/webp"></label><p id="thumbnail-file-status" role="status">${t.thumbnail?`Dipilih: ${wh(t.thumbnail.name)}`:'Belum ada gambar.'}</p></div></section>
 <div class="form-grid"><label class="field wide">Nama template<input id="admin-title" name="title" required maxlength="140" value="${wh(t.title)}"></label><label class="field wide">Kebutuhan kelas yang dibantu<textarea name="need" required maxlength="600">${wh(t.need)}</textarea></label><label class="field">Rentang<select name="scope">${wOptions(['single','semester','year'],t.scope).replace('>single<','>Perangkat satuan<').replace('>semester<','>Paket 1 semester<').replace('>year<','>Paket 1 tahun<')}</select></label><label class="field">Harga PramuKoin<input name="price" type="number" min="0" max="100000" step="1" required value="${t.price||0}"><span class="field-note">Isi 0 untuk gratis.</span></label><label class="field">Jenjang<select name="level">${wOptions(['Semua','SD','SMP'],t.level)}</select></label><label class="field">Mapel<select name="subject">${wOptions(['Semua','Matematika','Bahasa Indonesia'],t.subject)}</select></label></div>
 <fieldset><legend>Isi paket</legend>${PramuCore.TYPES.map(x=>`<label class="check"><input name="types" type="checkbox" value="${x}" ${t.types.includes(x)?'checked':''}>${x}</label>`).join('')}<p class="field-note">Paket semester/tahun Pramuajar biasanya berisi Modul Ajar, RPP, dan LKPD.</p></fieldset>
 <fieldset><legend>Diferensiasi yang tersedia</legend>${PramuCore.DIFFS.map(d=>`<label class="check"><input name="diffs" type="checkbox" value="${d}" ${t.diffs.includes(d)?'checked':''}>${d}</label><label class="field">Pelaksanaan ${d}<textarea name="adapt-${d}" maxlength="12000" placeholder="Jelaskan pilihan bantuan dan cara memeriksa tujuan yang sama.">${wh(t.adaptations[d]||'')}</textarea></label>`).join('')}</fieldset>
 <h2>Ringkasan katalog</h2><p class="field-note">Ini bukan isi file. Ringkasan membantu guru memahami apa yang akan diterima sebelum membeli.</p><div id="admin-sections">${t.sections.map((s,i)=>`<section class="panel" style="margin-bottom:12px"><label class="field">Judul ringkasan ${i+1}<input name="section-title" maxlength="140" required value="${wh(s.title)}"></label><label class="field">Penjelasan<textarea name="section-text" maxlength="12000" required>${wh(s.text)}</textarea></label></section>`).join('')}</div>${wb('Tambah ringkasan','admin-add-section')}
 <div class="form-footer">${wb('Batal','admin-back')}<button type="submit" class="btn primary">Simpan sebagai draf</button></div></div></form></section>`;
}

function readAdminForm(){
 const d=new FormData($('#admin-template-form'));
 return {...W.adminDraft,title:String(d.get('title')).trim(),need:String(d.get('need')).trim(),scope:d.get('scope'),price:Number(d.get('price')),level:d.get('level'),subject:d.get('subject'),types:d.getAll('types'),diffs:d.getAll('diffs'),adaptations:Object.fromEntries(PramuCore.DIFFS.map(x=>[x,String(d.get('adapt-'+x)||'').trim()])),sections:d.getAll('section-title').map((title,i)=>({title:String(title).trim(),text:String(d.getAll('section-text')[i]||'').trim()}))};
}

function saveAdminTemplate(){
 const t=readAdminForm(),errors=PramuCore.templateErrors(t);if(errors.length){$('#admin-errors').innerHTML=`<div class="inline-error">${errors.map(wh).join('<br>')}</div>`;$('#admin-errors').scrollIntoView({block:'center'});return}
 const i=state.templates.findIndex(x=>x.id===t.id),old=state.templates[i];if(old?.version>0&&!t.lastPublished)t.lastPublished=structuredClone({...old,versions:[],lastPublished:undefined});t.status='draft';t.updated=new Date().toISOString();if(i>=0)state.templates[i]=t;else state.templates.push(t);if(!storeWorkspace()){if(i>=0)state.templates[i]=old;else state.templates.pop();return}W.adminDraft=null;go('admin');toast('Draf tersimpan. Belum tampil di katalog guru.');
}

function publishTemplate(id){
 const t=templateBy(id);if(!t)return;const errors=PramuCore.templateErrors(t);if(errors.length)return openModal('Template perlu dilengkapi',`<p>${errors.map(wh).join('<br>')}</p>`,btn('Tutup','close'));
 openModal('Periksa sebelum menerbitkan',`<h3>${wh(t.title)}</h3><p>${wh(templateScopeLabel(t.scope))} · ${wh(t.types.join(', '))}</p><p><strong>${wh(templatePriceLabel(t))}</strong> · ${wh(t.file.name)}</p>${t.diffs.map(d=>`<div class="diff-detail"><strong>${wh(d)}</strong><p>${wh(t.adaptations[d])}</p></div>`).join('')}<label class="check" style="margin-top:20px"><input id="admin-reviewed" type="checkbox">File, thumbnail, harga, ringkasan, dan diferensiasi sudah ditinjau.</label><p class="field-note">Versi yang sudah dibeli guru tetap tersimpan dalam riwayat.</p>`,btn('Batal','close')+wb('Terbitkan ke katalog lokal','publish-template-confirm',id,'primary'));
}

function fileAsDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Berkas tidak dapat dibaca.'));reader.readAsDataURL(file);});}

document.addEventListener('click',e=>{const el=e.target.closest('[data-w]');if(!el)return;const a=el.dataset.w,v=el.dataset.value;
 if(a==='new-template')adminEdit();
 else if(a==='edit-template')adminEdit(v);
 else if(a==='admin-back'){W.adminDraft=null;go('admin')}
 else if(a==='admin-add-section'){W.adminDraft=readAdminForm();if(W.adminDraft.sections.length>=20)return toast('Maksimal 20 ringkasan.');W.adminDraft.sections.push({title:'',text:''});render();$$('[name=section-title]').at(-1).focus();}
 else if(a==='publish-template')publishTemplate(v);
 else if(a==='publish-template-confirm'){if(!$('#admin-reviewed').checked)return toast('Konfirmasikan tinjauan isi terlebih dahulu.');const t=templateBy(v);if(PramuCore.templateErrors(t).length)return;const before=structuredClone(t);if(t.lastPublished){t.versions.push(t.lastPublished);delete t.lastPublished}t.version=(t.version||0)+1;t.status='published';t.updated=new Date().toISOString();if(!storeWorkspace()){Object.assign(t,before);return}closeModal();render();toast('Template terbit di katalog lokal.');}
 else if(a==='archive-template')openModal('Arsipkan template?','<p>Template tidak muncul untuk pembelian baru. File yang sudah dimiliki guru dan riwayat versi tetap tersedia.</p>',btn('Batal','close')+wb('Arsipkan','archive-template-confirm',v,'primary'));
 else if(a==='archive-template-confirm'){templateBy(v).status='archived';persist();closeModal();render();}
 else if(a==='template-history'){const t=templateBy(v);openModal('Riwayat template',`<p>Versi saat ini: ${t.version}</p>${t.versions.length?t.versions.map(x=>`<div class="panel"><strong>Versi ${x.version} · ${wh(x.title)}</strong><p>${wh(x.file?.name||'Tanpa file')} · ${wh(templatePriceLabel(x))}</p>${wb('Lihat versi','template-version',v+'|'+x.version,'text')}</div>`).join(''):'<p>Belum ada versi sebelumnya.</p>'}`,btn('Tutup','close'));}
 else if(a==='template-version'){const [id,version]=v.split('|'),t=templateBy(id).versions.find(x=>x.version===Number(version));openModal('Versi '+version,`<p><strong>${wh(t.title)}</strong></p><p>${wh(t.file?.name||'Tanpa file')} · ${wh(templatePriceLabel(t))}</p>${diffLabels(t.diffs)}`,btn('Tutup','close'));}
 else if(a==='download-template-format')download('contoh-data-template-pramuajar.json',JSON.stringify({...starterTemplates[0],id:undefined,status:undefined,versions:undefined,version:undefined,file:{name:'unggah-di-admin.pdf',type:'application/pdf',size:0},thumbnail:{name:'unggah-di-admin.jpg',type:'image/jpeg',size:0}},null,2));
});

document.addEventListener('submit',e=>{if(e.target.id==='admin-template-form'){e.preventDefault();saveAdminTemplate()}});

document.addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(e.target.id==='admin-upload'){
  const status=$('#admin-upload-status');try{if(!file.name.toLowerCase().endsWith('.json')||file.size>204800)throw Error('Gunakan berkas .json maksimal 200 KB.');const raw=JSON.parse(await file.text());adminEdit('',normalizeTemplate(raw));toast('Data katalog dibaca sebagai draf. Unggah file perangkat dan thumbnail sebelum menyimpan.');}catch(err){status.textContent='Tidak dapat membaca data: '+err.message;e.target.value='';}return;
 }
 if(e.target.name==='template-file'){
  const allowed=['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];try{if(!allowed.includes(file.type)||file.size>1048576)throw Error('Gunakan PDF atau DOCX maksimal 1 MB.');W.adminDraft.file={name:file.name,type:file.type,size:file.size,data:await fileAsDataUrl(file)};$('#template-file-status').textContent=`Dipilih: ${file.name} · ${Math.ceil(file.size/1024)} KB`;}catch(err){$('#template-file-status').textContent=err.message;e.target.value='';}return;
 }
 if(e.target.name==='thumbnail-file'){
  const allowed=['image/png','image/jpeg','image/webp'];try{if(!allowed.includes(file.type)||file.size>358400)throw Error('Gunakan PNG, JPG, atau WebP maksimal 350 KB.');W.adminDraft.thumbnail={name:file.name,type:file.type,size:file.size,data:await fileAsDataUrl(file)};$('#thumbnail-file-status').textContent=`Dipilih: ${file.name} · ${Math.ceil(file.size/1024)} KB`;const preview=$('.admin-thumb-preview')||$('.admin-thumb-empty');preview.outerHTML=`<img class="admin-thumb-preview" src="${wh(W.adminDraft.thumbnail.data)}" alt="Thumbnail yang dipilih">`;}catch(err){$('#thumbnail-file-status').textContent=err.message;e.target.value='';}
 }
});
