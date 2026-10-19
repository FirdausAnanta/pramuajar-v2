function classroomRosterKey(classId=state.activeClass,year=state.profile.year){workspaceData();state.rosterLinks??={};const link=JSON.stringify([classId,year]);return state.rosterLinks[link]??=PramuCore.rosterKey(classBy(classId),year);}
function getRoster(classId=state.activeClass,year=state.profile.year){const key=classroomRosterKey(classId,year);return state.rosters[key]??=[];}
function getGroups(classId=state.activeClass,year=state.profile.year){const key=classroomRosterKey(classId,year);return state.groups[key]??={topic:'',assignments:{}};}
classes=function(){
  workspaceData();
  const totalClasses = state.classes.length;
  const totalStudents = state.classes.reduce((sum, c) => sum + getRoster(c.id).filter(s => s.active !== false).length, 0);
  const totalNotes = (state.studentNotes || []).length + (state.classNotes?.length || 0);
  return `<section class="classes-hero-banner">
    <div class="classes-hero-text">
      <h1>Kelas & Siswa</h1>
      <p>Kelola siswa, kelompok kegiatan kolaboratif, pengamatan diferensiasi, dan perangkat ajar dalam satu ruang terpadu.</p>
    </div>
    <div class="classes-stats-ribbon">
      <div class="class-stat-box stat-cyan">
        <span class="stat-num">${totalClasses}</span>
        <span class="stat-lbl">Kelas Aktif</span>
      </div>
      <div class="class-stat-box stat-emerald">
        <span class="stat-num">${totalStudents}</span>
        <span class="stat-lbl">Siswa Aktif</span>
      </div>
      <div class="class-stat-box stat-amber">
        <span class="stat-num">${totalNotes}</span>
        <span class="stat-lbl">Pengamatan</span>
      </div>
    </div>
  </section>
  <div class="row between wrap" style="margin-bottom:20px;align-items:center">
    <div>
      <h2 style="font-size:18px;font-weight:700;margin:0">Daftar Kelas (${totalClasses})</h2>
      <p class="field-note" style="margin:2px 0 0 0">Pilih kelas untuk mengelola siswa dan catatan pembelajaran.</p>
    </div>
    ${btn(icon('plus')+' Tambah kelas','add-class','','primary')}
  </div>
  <div class="class-grid">${state.classes.map(c=>{
    const n = latestNote(c.id);
    const roster = getRoster(c.id);
    const activeCount = roster.filter(s => s.active !== false).length;
    const isMath = c.subject === 'Matematika';
    return `<article class="panel class-card ${isMath ? 'card-math' : 'card-indo'}">
      <div class="row" style="align-items:center;gap:14px">
        <div class="class-monogram ${isMath ? 'mono-cyan' : 'mono-amber'}">${escapeHTML(c.name)}</div>
        <div>
          <span class="subject-pill ${isMath ? 'pill-cyan' : 'pill-amber'}">${isMath ? 'Matematika' : 'Bahasa Indonesia'}</span>
          <h2 style="margin:4px 0 2px 0;font-size:17px">${escapeHTML(c.subject)}</h2>
          <p class="small muted" style="margin:0">${escapeHTML(c.school)} · Tingkat ${c.grade} (${c.level})</p>
        </div>
      </div>
      <div class="class-card-meta-chips" style="margin-top:16px">
        <span class="meta-chip chip-blue">${activeCount} siswa aktif</span>
        <span class="meta-chip chip-neutral">${c.days.join(', ')} · ${c.jp*c.duration} mnt</span>
      </div>
      <div class="class-note" style="margin-top:14px">
        <span class="small muted font-semibold">${n ? 'Catatan terbaru' + (n.sample ? ' · contoh' : '') : 'Belum ada catatan'}</span>
        <p style="margin:4px 0 0 0;font-size:13px;line-height:1.5">${n ? escapeHTML(n.text.slice(0, 160)) + '…' : 'Mulai dari pengamatan Anda, bukan label kemampuan siswa.'}</p>
      </div>
      <div class="row wrap" style="margin-top:16px;padding-top:12px;border-top:1px solid var(--line)">
        ${btn('Buka kelas','view-class',c.id,'primary')}
        ${btn('Tanya Prama','prama-class',c.id,'text')}
        ${btn('Ubah','edit-class',c.id,'text')}
      </div>
    </article>`;
  }).join('')}</div>`;
};
const oldClassroom=classroom;
classroom=function(){
  workspaceData();
  const c=activeClass(),roster=getRoster(),active=roster.filter(s=>s.active!==false);
  return heading(wh(c.name)+' · '+wh(c.subject),`${wh(c.school)} · ${wh(state.profile.year)}`,btn('Semua kelas','nav','classes'))+
  `<nav class="workspace-tabs" aria-label="Bagian kelas">${[['students','Daftar siswa'],['groups','Kelompok kegiatan'],['notes','Catatan siswa'],['overview','Perangkat & catatan kelas']].map(([id,title])=>wb(title,'class-tab',id,W.tab===id?'active':'')).join('')}</nav>
  ${W.tab==='students'?`<section class="panel">
    <div class="row between wrap" style="align-items:center;margin-bottom:12px">
      <div>
        <h2 style="margin:0">Daftar Siswa</h2>
        <p class="field-note" style="margin:3px 0 0 0">${active.length} siswa aktif · ${roster.length-active.length} tidak aktif. Dipakai bersama untuk mapel dalam kelas dan tahun yang sama.</p>
      </div>
      <div class="row wrap">${wb('Unggah / tempel daftar','import-students','','primary')}${wb('Tambah siswa','student-form')}</div>
    </div>
    <p class="private-notice">Prototipe lokal tanpa akun atau perlindungan akses. Gunakan nama contoh, bukan data pribadi siswa sungguhan.</p>
    ${roster.length?`<div class="roster-list">${roster.map((s, idx)=>{
      const avatarIndex = (idx % 5) + 1;
      const initials = s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      return `<div class="roster-row ${s.active===false?'inactive':''}">
        <div class="student-avatar-box">
          <img src="pramuajar-assets-v2/img/avatar-${avatarIndex}.png" alt="${wh(s.name)}" class="student-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="student-initials-fallback" style="display:none">${initials}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div class="row" style="align-items:center;gap:8px">
            <div class="student-name font-semibold">${wh(s.name)}</div>
            <span class="apple-status-pill ${s.active===false?'inactive':'active'}">${s.active===false?'Nonaktif':'Aktif'}</span>
          </div>
          <span class="small muted">No. Absen: ${wh(s.number||'—')} · NIS: ${wh(s.nis||'belum diisi')}</span>
        </div>
        <div class="roster-actions">
          ${wb('Catat','student-note',s.id,'text')}
          ${wb('Ubah','student-form',s.id,'text')}
          ${wb(s.active===false?'Aktifkan':'Nonaktifkan','student-active',s.id,'text')}
        </div>
      </div>`;
    }).join('')}</div>`:`<div class="workspace-empty"><h3>Nama siswa boleh ditambahkan kapan saja.</h3><p>Unggah Excel/CSV atau tempel daftar. LKPD tetap bisa dibuat tanpa nama.</p>${wb('Masukkan daftar siswa','import-students','','primary')}</div>`}
  </section>`:W.tab==='groups'?groupsView():W.tab==='notes'?studentNotesView():oldClassroom()}`;
};
function importStudents(){W.importRows=null;W.importPreview=null;openModal('Masukkan daftar siswa',`<p>Kolom wajib: Nama. Kolom pilihan: NIS dan Absen. Maksimal 500 siswa, berkas 1 MB. Untuk Excel, gunakan lembar pertama dan simpan nomor induk sebagai teks.</p><div class="upload-box"><label class="field">Unggah Excel (.xlsx) atau CSV<input id="roster-file" type="file" accept=".xlsx,.csv"></label><p class="field-note">Diproses di browser; tidak dikirim ke server.</p></div><p style="margin:15px 0">Atau tempel nama, satu siswa per baris. Tabel yang disalin dari Excel juga didukung.</p><label class="field">Daftar nama<textarea id="paste-students" maxlength="200000" placeholder="Nama,NIS,Absen&#10;Roni,001,1&#10;Yola,002,2"></textarea></label><p id="import-error" role="alert"></p><div class="row wrap" style="margin-top:15px">${wb('Unduh format Excel','roster-format')}${wb('Periksa daftar','preview-paste','','primary')}</div>`,btn('Batal','close'));}
function prepareImport(rows){if(!rows.length)throw Error('Daftar kosong.');if(rows.length>501)throw Error('Maksimal 500 siswa.');const header=rows[0].map(x=>String(x).trim().toLowerCase()),name=header.findIndex(x=>/^(nama|nama lengkap|nama siswa|name)$/.test(x));if(name<0&&rows.every(r=>r.length===1)){W.importRows=[['Nama'],...rows];W.importMap={name:0,nis:-1,number:-1};}else{W.importRows=rows;W.importMap={name:name<0?0:name,nis:header.findIndex(x=>/^(nis|nisn|nomor induk|nomor induk sekolah)$/.test(x)),number:header.findIndex(x=>/^(absen|no|nomor|nomor absen)$/.test(x))};}if(W.importRows.length>501)throw Error('Maksimal 500 siswa.');mapRosterPreview();}
function mapRosterPreview(){const rows=W.importRows,m=W.importMap;W.importPreview=PramuCore.inspectRoster(rows.slice(1).map(r=>({name:r[m.name]??'',nis:m.nis<0?'':r[m.nis]??'',number:m.number<0?'':r[m.number]??''})),getRoster());showImportPreview();}
function showImportPreview(){const r=W.importPreview,header=W.importRows[0],problems=r.filter(x=>x.errors.length).length;openModal('Periksa sebelum menyimpan',`<p>${r.length} baris · ${r.filter(x=>x.matchId).length} calon pembaruan · ${problems} baris perlu diperbaiki. Nama sama tidak digabung otomatis.</p><details class="simple-details"><summary>Cocokkan judul kolom</summary><div class="form-grid">${[['name','Nama wajib'],['nis','Nomor induk'],['number','Nomor absen']].map(([k,label])=>`<label class="field">${label}<select data-roster-map="${k}">${k!=='name'?'<option value="-1">Tidak ada</option>':''}${header.map((h,i)=>`<option value="${i}" ${W.importMap[k]===i?'selected':''}>${wh(h||'Kolom '+(i+1))}</option>`).join('')}</select></label>`).join('')}</div></details><div class="table-scroll"><table><thead><tr><th>Nama</th><th>Nomor induk</th><th>Absen</th><th>Pemeriksaan</th></tr></thead><tbody>${r.map((s,i)=>`<tr><td><input aria-label="Nama baris ${i+1}" data-import-edit="${i}" data-key="name" maxlength="100" value="${wh(s.name)}"></td><td><input aria-label="Nomor induk baris ${i+1}" data-import-edit="${i}" data-key="nis" maxlength="40" value="${wh(s.nis)}"></td><td><input aria-label="Absen baris ${i+1}" data-import-edit="${i}" data-key="number" maxlength="10" value="${wh(s.number)}"></td><td>${s.errors.map(x=>`<p class="inline-error">${wh(x)}</p>`).join('')}${s.warnings.map(x=>`<p>${wh(x)}</p>`).join('')}${!s.errors.length&&!s.warnings.length?'Siap ditambahkan':''}${wb('Kecualikan','exclude-import-row',i,'text')}</td></tr>`).join('')}</tbody></table></div>${r.some(s=>s.matchId)?'<label class="check" style="margin-top:15px"><input id="approve-roster-update" type="checkbox">Saya menyetujui pembaruan siswa dengan nomor induk yang sama.</label>':''}<p class="field-note">Siswa yang tidak ada pada unggahan tidak dihapus. Tidak ada perubahan sebelum Anda menyimpan.</p>`,btn('Batal','close')+wb('Simpan daftar siswa','commit-students','','primary'));}
function commitStudents(){const inspected=PramuCore.inspectRoster(W.importPreview,getRoster());W.importPreview=inspected;if(!inspected.length)return toast('Tidak ada baris untuk disimpan.');if(inspected.some(x=>x.errors.length)){showImportPreview();return toast('Perbaiki atau kecualikan baris bermasalah.');}if(inspected.some(x=>x.matchId)&&!$('#approve-roster-update')?.checked)return toast('Konfirmasikan pembaruan berdasarkan nomor induk.');const roster=getRoster(),before=structuredClone(roster);for(const row of inspected){const fields={name:row.name,nis:row.nis,number:row.number},old=roster.find(x=>x.id===row.matchId);if(old){if(W.importMap?.number<0&&!row.number)delete fields.number;Object.assign(old,fields);}else roster.push({id:uid('student'),...fields,active:true});}if(!storeWorkspace()){roster.splice(0,roster.length,...before);return}W.importRows=null;W.importPreview=null;closeModal();render();toast('Daftar siswa tersimpan.');}
function studentForm(id=''){const s=getRoster().find(x=>x.id===id)||{name:'',nis:'',number:''};openModal(id?'Ubah siswa':'Tambah siswa',`<form id="student-form" data-id="${wh(id)}"><div class="stack"><label class="field">Nama lengkap<input name="name" required maxlength="100" value="${wh(s.name)}"></label><label class="field">Nomor induk (opsional)<input name="nis" maxlength="40" value="${wh(s.nis)}"></label><label class="field">Nomor absen (opsional)<input name="number" maxlength="10" value="${wh(s.number)}"></label><p id="student-error" role="alert"></p><div class="form-footer">${btn('Batal','close')}<button class="btn primary" type="submit">Simpan siswa</button></div></div></form>`);}
function groupsView(){
  const students=getRoster().filter(s=>s.active!==false),g=getGroups();
  const groupColors = {'1':'group-cyan','2':'group-emerald','3':'group-amber','4':'group-purple','5':'group-rose','6':'group-indigo','7':'group-teal','8':'group-orange'};
  const assignedCount = students.filter(s=>g.assignments[s.id]).length;
  return `<section class="panel">
    <div class="row between wrap" style="align-items:center;margin-bottom:14px">
      <div>
        <h2 style="margin:0">Kelompok untuk Kegiatan Ini</h2>
        <p class="lead small" style="margin:4px 0 0 0">Kelompok bersifat dinamis dan sementara untuk kegiatan, bukan label kemampuan tetap.</p>
      </div>
      <div class="roster-badge-pill">${assignedCount} / ${students.length} Siswa Terbagi</div>
    </div>
    ${students.length?`<form id="groups-form">
      <label class="field" style="margin:16px 0 20px 0">Topik / kegiatan
        <input name="topic" required maxlength="180" value="${wh(g.topic)}" placeholder="Contoh: Diskusi berpasangan membandingkan desimal">
      </label>
      <div class="groups-student-grid">
        ${students.map(s=>{
          const assigned = g.assignments[s.id] || '';
          const colorClass = groupColors[assigned] || '';
          return `<label class="group-member ${colorClass}">
            <div class="group-member-info">
              <span class="student-name font-semibold">${wh(s.name)}</span>
              <small class="muted">NIS: ${wh(s.nis||'—')}</small>
            </div>
            <select data-group-student="${wh(s.id)}" class="group-select">
              ${wOptions(['1','2','3','4','5','6','7','8'],assigned,'Belum dibagi')}
            </select>
          </label>`;
        }).join('')}
      </div>
      <p class="field-note" id="unassigned-count" style="margin-top:16px">${students.filter(s=>!g.assignments[s.id]).length} siswa belum mendapat kelompok.</p>
      <button class="btn primary" type="submit" style="margin-top:12px">Simpan kelompok kegiatan</button>
    </form>`:`<div class="workspace-empty"><p>Tambahkan daftar siswa sebelum membentuk kelompok.</p>${wb('Masukkan daftar siswa','import-students','','primary')}</div>`}
  </section>`;
}
function studentNotesView(){
  const notes=state.studentNotes.filter(n=>n.rosterKey===classroomRosterKey());
  return `<section class="panel">
    <div class="row between wrap" style="align-items:center;margin-bottom:14px">
      <div>
        <h2 style="margin:0">Catatan Siswa & Pengamatan Kelompok</h2>
        <p class="field-note" style="margin:3px 0 0 0">Pengamatan guru, bukan nilai asesmen. Tidak otomatis masuk laporan umum.</p>
      </div>
      ${wb(icon('plus')+' Tambah pengamatan','student-note','','primary')}
    </div>
    ${notes.length?`<div class="notes-grid">${notes.map(n=>{
      const isGroup = n.targetLabel.startsWith('Kelompok');
      return `<article class="panel journal-card note-card-apple ${isGroup ? 'border-group' : 'border-student'}">
        <div class="row between wrap" style="align-items:center;margin-bottom:8px">
          <span class="note-target-pill ${isGroup ? 'pill-purple' : 'pill-cyan'}">${isGroup ? '👥 ' + wh(n.targetLabel) : '👤 ' + wh(n.targetLabel)}</span>
          <span class="small muted">${wh(n.date)}</span>
        </div>
        <h3 style="margin:4px 0 6px 0;font-size:15px;font-weight:600">${wh(n.topic)}</h3>
        <p class="note-excerpt" style="font-size:13.5px;line-height:1.6;color:var(--text)">${wh(n.text)}</p>
        ${n.followup?`<div class="note-followup-callout"><strong style="color:var(--apple-purple)">💡 Tindak lanjut:</strong> <span style="font-size:13px">${wh(n.followup)}</span></div>`:''}
      </article>`;
    }).join('')}</div>`:'<div class="workspace-empty"><p>Belum ada pengamatan individual. Catat ketika ada kebutuhan khusus atau temuan bermakna.</p></div>'}
  </section>`;
}
function studentNoteForm(id=''){const students=getRoster().filter(s=>s.active!==false),g=getGroups(),groups=[...new Set(Object.values(g.assignments).filter(Boolean))];openModal('Catat pengamatan',`<form id="student-note-form"><div class="stack"><label class="field">Cakupan<select name="target" required><option value="">Pilih siswa atau kelompok</option>${students.map(s=>`<option value="student:${s.id}" ${s.id===id?'selected':''}>${wh(s.name)} · ${wh(s.nis||s.number||s.id.slice(-4))}</option>`).join('')}${groups.map(x=>`<option value="group:${x}">Kelompok ${wh(x)} · ${wh(g.topic)}</option>`).join('')}</select></label><label class="field">Tanggal pengamatan<input name="date" type="date" required value="${today()}"></label><label class="field">Topik / kompetensi<input name="topic" required maxlength="180"></label><label class="field">Apa yang Anda amati?<textarea name="text" required maxlength="3000"></textarea></label><label class="field">Tindak lanjut (opsional)<textarea name="followup" maxlength="2000"></textarea></label><p class="field-note">Pilih identitas yang tepat jika nama sama. Catatan tersimpan setelah Anda menekan tombol di bawah.</p><button class="btn primary" type="submit">Konfirmasi & simpan pengamatan</button></div></form>`);}
function recipientForm(){const p=getPlan(),c=classBy(p.classId),students=getRoster(c.id,p.year||state.profile.year).filter(s=>s.active!==false),g=getGroups(c.id,p.year||state.profile.year);openModal('Nama pada LKPD',`<p>${wh(c.name)} · Pertemuan ${p.meetings[selectedMeeting].number}. Nama disalin ke perangkat ini tanpa koin.</p><label class="field">Penggunaan<select id="recipient-mode"><option value="none">Tanpa nama</option><option value="individual">Per siswa</option><option value="group">Per kelompok kegiatan</option></select></label><div id="recipient-choice" style="margin-top:18px"></div><p class="field-note">Kelompok saat ini: ${wh(g.topic||'belum diatur')}. ${students.filter(s=>!g.assignments[s.id]).length} siswa belum mendapat kelompok.</p>`,btn('Batal','close')+wb('Simpan nama pada LKPD','save-recipients','','primary'));renderRecipientChoices();}
function renderRecipientChoices(){const p=getPlan(),mode=$('#recipient-mode').value,students=getRoster(p.classId,p.year||state.profile.year).filter(s=>s.active!==false);$('#recipient-choice').innerHTML=mode==='individual'?`<p>Pilih siswa yang akan mendapat salinan.</p><div class="check-list">${students.map(s=>`<label><input name="recipient-student" type="checkbox" value="${s.id}" checked>${wh(s.name)} · ${wh(s.nis||'tanpa nomor induk')}</label>`).join('')}</div>${!students.length?'<p>Belum ada siswa. Tambahkan melalui Kelas & Siswa.</p>':''}`:mode==='group'?'<p>Setiap kelompok mendapat satu salinan, dengan nama anggota sesuai pembagian terakhir. Siswa yang belum dibagi perlu ditangani sebelum menyimpan.</p>':'<p>LKPD berisi kolom nama kosong, cocok untuk cetak umum.</p>';}
function saveRecipients(){const p=getPlan(),m=p.meetings[selectedMeeting],mode=$('#recipient-mode').value,students=getRoster(p.classId,p.year||state.profile.year).filter(s=>s.active!==false),g=getGroups(p.classId,p.year||state.profile.year);let recipients=[];if(mode==='individual'){const ids=$$('[name=recipient-student]:checked').map(x=>x.value);recipients=students.filter(s=>ids.includes(s.id)).map(s=>({label:'Nama siswa',ids:[s.id],names:[s.name]}));if(!recipients.length)return toast('Pilih setidaknya satu siswa.');}if(mode==='group'){if(!students.length||students.some(s=>!g.assignments[s.id]))return toast('Lengkapi pembagian kelompok semua siswa aktif di Kelas & Siswa.');recipients=[...new Set(students.map(s=>g.assignments[s.id]))].map(group=>{const members=students.filter(s=>g.assignments[s.id]===group);return {label:'Kelompok '+group+' · '+g.topic,ids:members.map(s=>s.id),names:members.map(s=>s.name)};});}m.recipients=recipients;m.recipientMode=mode;m.recipientDate=new Date().toISOString();p.published=false;persist();closeModal();render();toast('Nama pada LKPD tersimpan sebagai salinan.');}
function workbookDownload(rows,name,sheet='Data'){if(typeof XLSX==='undefined')return toast('Pustaka Excel tidak termuat. Pastikan folder pramuajar-assets ikut disimpan.');const book=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(rows.map(r=>r.map(v=>String(v??''))));ws['!cols']=rows[0].map((_,i)=>({wch:i<4?20:45}));XLSX.utils.book_append_sheet(book,ws,sheet);XLSX.writeFile(book,name,{bookType:'xlsx',compression:true});}
async function readRosterFile(file){if(!/\.(xlsx|csv)$/i.test(file.name)||file.size>1048576)throw Error('Gunakan .xlsx atau .csv maksimal 1 MB.');if(/\.csv$/i.test(file.name))return PramuCore.parseCSV(await file.text());if(typeof XLSX==='undefined')throw Error('Pustaka Excel tidak termuat. Gunakan CSV atau tempel daftar.');const bytes=new Uint8Array(await file.arrayBuffer());if(bytes[0]!==80||bytes[1]!==75)throw Error('Isi berkas bukan workbook .xlsx.');let expanded=0;const v=new DataView(bytes.buffer);for(let i=0;i+46<bytes.length;i++){if(v.getUint32(i,true)===0x02014b50){expanded+=v.getUint32(i+24,true);if(expanded>20971520)throw Error('Isi workbook terlalu besar. Salin hanya daftar siswa ke berkas baru.');}}const book=XLSX.read(bytes,{type:'array',sheetRows:502,cellFormula:false,cellHTML:false,cellText:true}),sheet=book.Sheets[book.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:'',blankrows:false});if(rows.length>501)throw Error('Maksimal 500 siswa.');return rows;}
document.addEventListener('click',e=>{const el=e.target.closest('[data-w]');if(!el)return;const a=el.dataset.w,v=el.dataset.value;
 if(a==='class-tab'){W.tab=v;render()}
 else if(a==='import-students')importStudents();
 else if(a==='preview-paste'){try{prepareImport(PramuCore.parseCSV($('#paste-students').value))}catch(err){$('#import-error').textContent=err.message}}
 else if(a==='exclude-import-row'){W.importPreview.splice(Number(v),1);W.importPreview=PramuCore.inspectRoster(W.importPreview,getRoster());showImportPreview();}
 else if(a==='commit-students')commitStudents();
 else if(a==='student-form')studentForm(v);
 else if(a==='student-note')studentNoteForm(v);
 else if(a==='student-active'){const s=getRoster().find(s=>s.id===v);openModal(s.active===false?'Aktifkan siswa?':'Nonaktifkan siswa?',`<p>${wh(s.name)}. Riwayat catatan dan LKPD lama tetap disimpan.</p>`,btn('Batal','close')+wb('Konfirmasi','student-active-confirm',v,'primary'));}
 else if(a==='student-active-confirm'){const s=getRoster().find(s=>s.id===v);s.active=s.active===false;persist();closeModal();render();}
 else if(a==='lkpd-recipients')recipientForm();
 else if(a==='save-recipients')saveRecipients();
 else if(a==='roster-format')workbookDownload([['Nama','NIS','Absen'],['Roni (contoh)','001','1'],['Yola (contoh)','002','2']],'Format daftar siswa.xlsx','Siswa');
});
document.addEventListener('change',async e=>{const t=e.target;if(t.id==='roster-file'){try{if(t.files[0])prepareImport(await readRosterFile(t.files[0]));}catch(err){$('#import-error').textContent=err.message;t.value='';}}else if(t.dataset.rosterMap){W.importMap[t.dataset.rosterMap]=Number(t.value);mapRosterPreview();}else if(t.hasAttribute('data-import-edit')){W.importPreview[Number(t.dataset.importEdit)][t.dataset.key]=t.value;W.importPreview=PramuCore.inspectRoster(W.importPreview,getRoster());showImportPreview();}else if(t.id==='recipient-mode')renderRecipientChoices();else if(t.dataset.groupStudent){$('#unassigned-count').textContent=$$('[data-group-student]').filter(x=>!x.value).length+' siswa belum mendapat kelompok.';}});
document.addEventListener('submit',e=>{const f=e.target;if(f.id==='student-form'){e.preventDefault();const d=Object.fromEntries(new FormData(f)),r=getRoster(),old=r.find(x=>x.id===f.dataset.id),checked=PramuCore.inspectRoster([d],r.filter(x=>x!==old))[0];if(checked.errors.length||checked.matchId){$('#student-error').textContent=checked.errors.join(' ')||'Nomor induk sudah digunakan siswa lain.';return}if(old)Object.assign(old,{name:checked.name,nis:checked.nis,number:checked.number});else r.push({id:uid('student'),name:checked.name,nis:checked.nis,number:checked.number,active:true});persist();closeModal();render();toast(checked.warnings.length?'Tersimpan sebagai siswa berbeda dengan nama sama.':'Data siswa tersimpan.');}else if(f.id==='groups-form'){e.preventDefault();const g=getGroups();g.topic=new FormData(f).get('topic').trim();g.assignments=Object.fromEntries($$('[data-group-student]').map(x=>[x.dataset.groupStudent,x.value]));persist();toast('Kelompok tersimpan untuk kegiatan ini.');}else if(f.id==='student-note-form'){e.preventDefault();const d=Object.fromEntries(new FormData(f)),[scope,target]=d.target.split(':'),g=getGroups(),members=scope==='student'?getRoster().filter(s=>s.id===target):getRoster().filter(s=>s.active!==false&&g.assignments[s.id]===target);if(!members.length)return toast('Pilih siswa atau kelompok yang tersedia.');state.studentNotes.unshift({id:uid('observation'),...d,rosterKey:classroomRosterKey(),classId:state.activeClass,studentIds:members.map(s=>s.id),targetLabel:scope==='student'?members[0].name:'Kelompok '+target+' · '+members.map(s=>s.name).join(', '),source:'Pengamatan guru',created:new Date().toISOString()});persist();closeModal();W.tab='notes';render();}});
