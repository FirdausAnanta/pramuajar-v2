(function(root){
 'use strict';
 const DIFFS=['Konten','Proses','Produk','Lingkungan Belajar'];
 const TYPES=['LKPD','RPP','Modul Ajar','Materi Ajar','PPT'];
 const CORE_PACKAGE_TYPES=['Modul Ajar','RPP','LKPD'];
 const norm=s=>String(s??'').trim().toLowerCase();
 function filterTemplates(rows,f={}){return rows.filter(t=>t.status==='published'&&(!f.diff||t.diffs.includes(f.diff))&&(!f.type||t.types.includes(f.type))&&(!f.scope||(t.scope||'single')===f.scope)&&(!f.level||t.level==='Semua'||t.level===f.level)&&(!f.subject||t.subject==='Semua'||t.subject===f.subject)&&(!f.q||norm([t.title,t.need,t.subject,...t.diffs].join(' ')).includes(norm(f.q))));}
 function templateErrors(t){const e=[];
  if(!t||typeof t!=='object')return ['Berkas bukan template.'];
  if(typeof t.title!=='string'||!t.title.trim()||t.title.length>140)e.push('Nama template wajib diisi, maksimal 140 karakter.');
  if(!Array.isArray(t.types)||!t.types.length||t.types.some(x=>!TYPES.includes(x)))e.push('Pilih jenis perangkat yang didukung.');
  if(!Array.isArray(t.diffs)||!t.diffs.length||t.diffs.some(x=>!DIFFS.includes(x)))e.push('Pilih minimal satu diferensiasi.');
  if(!Array.isArray(t.sections)||!t.sections.length||t.sections.length>20||t.sections.some(s=>typeof s.title!=='string'||!s.title.trim()||typeof s.text!=='string'||!s.text.trim()||s.text.length>12000))e.push('Lengkapi judul dan isi setiap bagian (maksimal 20 bagian).');
  for(const d of t.diffs||[])if(typeof t.adaptations?.[d]!=='string'||t.adaptations[d].trim().length<40)e.push('Jelaskan pilihan bantuan dan pelaksanaannya untuk '+d+' (minimal 40 karakter).');
  if(!['single','semester','year'].includes(t.scope))e.push('Pilih rentang template: satuan, semester, atau tahun.');
  if(!Number.isInteger(t.price)||t.price<0||t.price>100000)e.push('Tentukan harga PramuKoin berupa bilangan bulat 0–100.000.');
  const fileTypes=['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],imageTypes=['image/png','image/jpeg','image/webp'];
  if(!t.file||typeof t.file.name!=='string'||!t.file.name.trim()||!fileTypes.includes(t.file.type)||(t.file.data&&!String(t.file.data).startsWith(`data:${t.file.type};base64,`)))e.push('Unggah isi template dalam format PDF atau DOCX.');
  if(!t.thumbnail||typeof t.thumbnail.name!=='string'||!t.thumbnail.name.trim()||!imageTypes.includes(t.thumbnail.type)||(t.thumbnail.data&&!String(t.thumbnail.data).startsWith(`data:${t.thumbnail.type};base64,`)))e.push('Unggah thumbnail PNG, JPG, atau WebP.');
  return e;
 }
 function aiDocumentTypes(scope){return scope==='semester'||scope==='year'?[...CORE_PACKAGE_TYPES]:[...TYPES];}
 function parseCSV(text){
  text=String(text).replace(/^\uFEFF/,'');const first=text.split(/\r?\n/)[0],delimiter=first.includes('\t')?'\t':first.includes(';')?';':',';
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(ch===delimiter&&!quoted){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=ch;}
  if(quoted)throw Error('Tanda kutip pada CSV belum ditutup.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  if(rows.length>501)throw Error('Maksimal 500 siswa dalam satu unggahan.');return rows;
 }
 function inspectRoster(rows,existing){const seenNis=new Set(),seenName=new Set();return rows.map(r=>{
  const name=String(r.name??'').trim(),nis=String(r.nis??'').trim(),number=String(r.number??'').trim(),errors=[],warnings=[];
  if(!name||name.length>100)errors.push('Nama wajib diisi, maksimal 100 karakter.');if(nis.length>40||number.length>10)errors.push('Nomor terlalu panjang.');
  if(nis&&seenNis.has(nis))errors.push('Nomor induk berulang dalam unggahan.');if(nis)seenNis.add(nis);
  const matches=nis?existing.filter(s=>s.nis===nis):[];if(matches.length>1)errors.push('Nomor induk cocok dengan lebih dari satu siswa.');
  if(seenName.has(norm(name))||existing.some(s=>norm(s.name)===norm(name)&&s.id!==matches[0]?.id))warnings.push('Nama sama; tetap disimpan sebagai siswa berbeda.');seenName.add(norm(name));
  if(matches.length===1)warnings.push('Nomor induk cocok: perlu persetujuan pembaruan.');
  return {name,nis,number,errors,warnings,matchId:matches[0]?.id||null};
 });}
 const rosterKey=(c,year)=>JSON.stringify([norm(c.school),norm(c.name),String(year)]);
 function reportRows(rows,f={}){return rows.filter(j=>j.status==='confirmed'&&j.delivery==='Terlaksana'&&(!f.classId||j.classId===f.classId)&&(!f.subject||j.subject===f.subject)&&(!f.from||j.date>=f.from)&&(!f.to||j.date<=f.to)).sort((a,b)=>a.date.localeCompare(b.date)||Number(a.meeting)-Number(b.meeting)).map((j,i)=>({no:i+1,date:j.date,className:j.className||'',subject:j.subject||'',meeting:j.meeting||'',topic:j.topic||'',objective:j.objective||'',method:j.method||'',result:j.result||'',evaluation:j.evaluation||'',followup:j.followup||'',differentiation:j.differentiation||'',version:j.version||1}));}
 const api={DIFFS,TYPES,CORE_PACKAGE_TYPES,filterTemplates,templateErrors,aiDocumentTypes,parseCSV,inspectRoster,rosterKey,reportRows};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PramuCore=api;
})(globalThis);
