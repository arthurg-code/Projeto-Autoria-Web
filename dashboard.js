(function(){
  const CHAVE_SALAS = 'sd_rooms_simple';
  const CHAVE_ATIVIDADES = 'sd_acts_simple';
  const CHAVE_SUBMISSOES = 'sd_subs_simple';
  const CHAVE_PUBLICACOES = 'sd_posts_simple';
  const CHAVE_NOTIFICACOES = 'sd_notifications';
  const CHAVE_MATERIAIS = 'sd_materiais';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const ler = k => JSON.parse(localStorage.getItem(k) || '[]');
  const gravar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const usuarioArmazenado = JSON.parse(localStorage.getItem('sd_current_user') || 'null');
  const PAPEL = usuarioArmazenado ? (String(usuarioArmazenado.tipo || '').toLowerCase()) : (String(document.body.dataset.role || 'aluno').toLowerCase());
  let dataCalendario = new Date();
  let salaAberta = null;
  let anexadoUltimoArquivo = null;
  function meuId() {
    const cur = JSON.parse(localStorage.getItem('sd_current_user') || 'null');
    if (cur && cur.id) {
      const ehProf = (String(cur.tipo || '').toLowerCase() === 'professor');
      return cur.id + (ehProf ? '_P' : '_S');
    }
    let id = localStorage.getItem('sd_user_simple');
    if (!id) {
      id = 'u_' + Math.random().toString(36).slice(2,9);
      localStorage.setItem('sd_user_simple', id);
    }
    return id + (PAPEL === 'professor' ? '_P' : '_S');
  }
const souProfessor = () => PAPEL === 'professor';

function escaparHtml(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function gerarCodigo() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let o = '';
  for (let i = 0; i < 6; i++) o += chars[Math.floor(Math.random() * chars.length)];
  return o;
}

function agoraISO() {
  return new Date().toISOString();
}
  function corAlternativa(hex) {
    try {
      const h = (hex || '#6C545C').replace('#','');
      const r = parseInt(h.substring(0,2),16);
      const g = parseInt(h.substring(2,4),16);
      const b = parseInt(h.substring(4,6),16);
      const adjust = v => Math.max(0, Math.min(255, Math.floor(v * 0.85)));
      const rr = adjust(r), gg = adjust(g), bb = adjust(b);
      const toHex = v => v.toString(16).padStart(2,'0');
      return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
    } catch(e) { return '#F1E9EA'; }
  }
  function perfilUsuarioPorId(uidStr) {
    const cur = JSON.parse(localStorage.getItem('sd_current_user') || 'null');
    if (cur && cur.id) {
      const curUid = cur.id + ((String(cur.tipo||'').toLowerCase() === 'professor') ? '_P' : '_S');
      if (curUid === uidStr) {
        const nome = cur.nome || cur.username || cur.id;
        const tipoNorm = (String(cur.tipo || '').toLowerCase() === 'professor') ? 'professor' : 'aluno';
        return { nome, iniciais: (nome[0] || 'U').toUpperCase(), tipo: tipoNorm };
      }
    }
    const usuarios = JSON.parse(localStorage.getItem('sd_users') || '[]');
    if (Array.isArray(usuarios)) {
      const achado = usuarios.find(u => {
        const cand = (u.id || '') + ((String(u.tipo||'').toLowerCase() === 'professor') ? '_P' : '_S');
        return cand === uidStr;
      });
      if (achado) {
        const n = achado.nome || achado.username || achado.id || uidStr;
        const tipoNorm = (String(achado.tipo || '').toLowerCase() === 'professor') ? 'professor' : 'aluno';
        return { nome: n, iniciais: (n[0]||'U').toUpperCase(), tipo: tipoNorm };
      }
    }
    const tipo = uidStr && uidStr.endsWith('_P') ? 'professor' : 'aluno';
    const base = String(uidStr || '').replace(/_[PS]$/,'');
    const exibicao = base || uidStr || 'Usuário';
    return { nome: exibicao, iniciais: (exibicao[0] || 'U').toUpperCase(), tipo };
  }
  function htmlBadgeUsuario(uidStr, op = {}) {
    const p = perfilUsuarioPorId(uidStr);
    const pequeno = !!op.small;
    const bg = '#6C545C'; const fg = '#FFFFFF';
    const tamanho = pequeno ? 26 : 36;
    const estiloAvatar = `width:${tamanho}px;height:${tamanho}px;border-radius:999px;background:${bg};color:${fg};display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:${pequeno?'1rem':'1.2rem'};`;
    if (pequeno) {
      return `<span style="display:inline-flex;align-items:center;gap:8px"><span style="${estiloAvatar}">${escaparHtml(p.iniciais)}</span><span style="font-weight:600;color:#333">${escaparHtml(p.nome)}</span></span>`;
    }
    return `<span style="display:inline-flex;align-items:center;gap:10px"><span style="${estiloAvatar}">${escaparHtml(p.iniciais)}</span><span style="display:flex;flex-direction:column;line-height:1"><span style="font-weight:700;color:#333">${escaparHtml(p.nome)}</span><span style="color:#888;font-size:.95em">${p.tipo}</span></span></span>`;
  }
  function carregarSalas(){ return ler(CHAVE_SALAS); }
  function salvarSalas(s){ gravar(CHAVE_SALAS,s); }
  function criarSala() {
    const nomeEl = $('#newRoomName');
    const subjEl = $('#newRoomSubject');
    const colorEl = $('#newRoomColor');
    const nome = nomeEl?.value?.trim();
    const subj = subjEl?.value?.trim();
    const cor = colorEl?.value || '#6C545C';
    if (!nome || !subj) return alert('Preencha nome e matéria');
    const salas = carregarSalas();
    const codigo = gerarCodigo();
    salas.push({ code: codigo, name: nome, subject: subj, primary: cor, secondary: corAlternativa(cor), owner: meuId(), created: agoraISO(), members: [] });
    salvarSalas(salas);
    if (nomeEl) nomeEl.value=''; if (subjEl) subjEl.value='';
    renderizarSalas();
    abrirSala(codigo);
    $('#modalCreateRoom')?.setAttribute('aria-hidden','true');
    adicionarNotificacao({ title: 'Sala criada', text: `Sala "${nome}" criada com o código ${codigo}` });
  }
  function renderizarSalas() {
    const salas = carregarSalas();
    if ($('#roomsList')) {
      const out = salas.map(r => htmlCartaoSala(r, true)).join('') || '<p class="muted">Nenhuma sala</p>';
      $('#roomsList').innerHTML = out;
    }
    if ($('#roomsListStudent')) {
      const entr = salas.filter(r => (r.members||[]).includes(meuId()));
      $('#roomsListStudent').innerHTML = (entr.length ? entr.map(r => htmlCartaoSala(r,false)).join('') : '<p class="muted">Você não entrou em salas</p>');
    }
    const minhas = salas.filter(r => r.owner === meuId());
    if ($('#myRoomsList')) {
      $('#myRoomsList').innerHTML = (minhas.length ? minhas.map(r=>htmlCartaoSala(r,true)).join('') : '<p class="muted">Você não criou salas</p>');
    }
    if ($('#myRoomsListStudent')) {
      $('#myRoomsListStudent').innerHTML = (minhas.length ? minhas.map(r=>htmlCartaoSala(r,true)).join('') : '<p class="muted">Você não criou salas</p>');
    }
    if ($('#activityRoomSelect')) {
      $('#activityRoomSelect').innerHTML = salas.map(r => `<option value="${r.code}">${escaparHtml(r.name)} (${r.code})</option>`).join('') || '<option>--</option>';
    }
  }
  function htmlCartaoSala(r, viewOwner){
    const isOwner = r.owner === meuId();
    const botoes = `<div class="room-actions" style="margin-top:8px;">
      <button class="btn small" onclick="abrirSala('${r.code}')">Abrir</button>
      ${ (viewOwner || isOwner) ? `<button class="btn small secondary" onclick="excluirSala('${r.code}')">Excluir</button>` : `<button class="btn small secondary" onclick="sairSala('${r.code}')">Sair</button>` }
    </div>`;
    return `<div class="room-card" data-room="${r.code}">
      <div class="room-banner" style="background:linear-gradient(135deg, ${r.primary}, ${r.secondary});">${escaparHtml(r.name)}</div>
      <div class="room-body"><h4>${escaparHtml(r.name)}</h4><div class="room-meta">${escaparHtml(r.subject)} • ${r.code}</div>${botoes}</div>
    </div>`;
  }
  function excluirSala(code){
    if (!confirm('Excluir sala?')) return;
    const salas = carregarSalas().filter(r => r.code !== code);
    salvarSalas(salas);
    renderizarSalas();
    renderizarAtividades();
    if (salaAberta === code) fecharVisualizacaoSala();
    adicionarNotificacao({ title: 'Sala excluída', text: `Sala ${code} foi excluída.` });
  }
  function abrirSala(code){
    const salas = carregarSalas();
    const s = salas.find(x => x.code === code);
    if (!s) return alert('Sala não encontrada');
    salaAberta = code;
    $('#salaTitle') && ($('#salaTitle').textContent = s.name);
    $('#salaMeta') && ($('#salaMeta').textContent = `${s.subject} • Código: ${s.code}`);
    const banner = $('#salaBanner');
    if (banner) banner.style.background = `linear-gradient(135deg, ${s.primary}, ${s.secondary})`;
    const botao = $('#joinLeaveBtn');
    if (botao) {
      const entrou = (s.members||[]).includes(meuId());
      botao.textContent = entrou ? 'Sair da sala' : (souProfessor() ? 'Você é professor' : 'Entrar na sala');
      botao.onclick = () => {
        if (souProfessor()) return alert('Você é o professor desta sala');
        if (entrou) sairSala(code);
        else {
          s.members = s.members||[];
          if (!s.members.includes(meuId())) s.members.push(meuId());
          salvarSalas(carregarSalas());
          renderizarSalas(); renderizarAtividades();
          renderizarAbaSala('mural');
          alert('Você entrou na sala');
        }
      };
    }
    renderizarAbaSala('mural');
    const recentes = ler(CHAVE_ATIVIDADES)
  .filter(a => a.room === code)
  .sort((a, b) => (b.created || 0) - (a.created || 0))
  .slice(0, 5);

if ($('#salaRecentActs')) {
  $('#salaRecentActs').innerHTML = 
    recentes.length
      ? recentes.map(a => `<div class="muted" style="margin-bottom:6px">${escaparHtml(a.title)} • ${escaparHtml(a.due)}</div>`).join('')
      : '<div class="muted">Sem atividades</div>';
}

$$('.panel').forEach(p => p.classList.toggle('active', p.id === 'sala'));
sincronizarLateralAtiva('sala');

    sincronizarLateralAtiva('sala');
  }
  function fecharVisualizacaoSala(){
    salaAberta = null;
    $$('.panel').forEach(p=>p.classList.toggle('active', p.id === 'inicio'));
    sincronizarLateralAtiva('inicio');
  }
  function renderizarAbaSala(aba) {
    const conteudo = $('#salaContent');
    if (!conteudo) return;
    if (!salaAberta) return;
    const sala = carregarSalas().find(r=>r.code===salaAberta);
    if (!sala) return;
    const publicacoes = ler(CHAVE_PUBLICACOES).filter(p => p.room === salaAberta && !p.replyTo).sort((a,b)=> (b?.time||0) - (a?.time||0));
    const respostas = ler(CHAVE_PUBLICACOES).filter(p => p.room === salaAberta && p.replyTo).sort((a,b)=> (a?.time||0) - (b?.time||0));
    const atos = ler(CHAVE_ATIVIDADES).filter(a => a.room === salaAberta).sort((a,b)=> (b?.created||0) - (a?.created||0));
    if (aba === 'mural') {
      conteudo.innerHTML = `<div class="create-post">
          <textarea id="postText" placeholder="Escreva..."></textarea>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
            <label class="file-btn">Anexar arquivo
              <input id="postFile" type="file" style="display:none">
            </label>
            <button class="btn" onclick="criarPublicacao('${salaAberta}')">Postar</button>
            <span id="anexadoFileInfo" style="font-size:.95em; color: #3a6b47; margin-left:14px;"></span>
          </div>
        </div>
        <div id="postsList" style="margin-top:12px;">${publicacoes.map(p => htmlPublicacaoComRespostas(p, respostas)).join('')}</div>`;
      const fileEl = $('#postFile');
      if (fileEl) {
        fileEl.addEventListener('change', () => {
          if (fileEl.files.length) {
            anexadoUltimoArquivo = fileEl.files[0];
            $('#anexadoFileInfo').textContent = anexadoUltimoArquivo.name;
          } else {
            anexadoUltimoArquivo = null;
            $('#anexadoFileInfo').textContent = '';
          }
        });
      }
    } else if (aba === 'atividades') {
      conteudo.innerHTML = `<div style="margin-bottom:12px;">${atos.length ? atos.map(a => htmlLinhaAtividade(a)).join('') : '<p class="muted">Sem atividades</p>'}</div>`;
    } else {
      const membros = (sala.members||[]).map(m => `<li>${htmlBadgeUsuario(m, { small: true })}</li>`).join('');
      const donoHtml = htmlBadgeUsuario(sala.owner || '', { small: true });
      conteudo.innerHTML = `<div class='sala-card' style='gap: 1.2rem'><h4>Professor</h4><p>${donoHtml}</p><h4>Alunos (${(sala.members||[]).length})</h4><ul style='display: grid; gap: 8px'>${membros}</ul></div>`;
    }
  }
  function fecharDetalhesSala(){ $('#modalRoomDetails')?.setAttribute('aria-hidden','true'); }
  function htmlPublicacaoComRespostas(post, respostas){
    const autorHtml = htmlBadgeUsuario(post.author || '', { small: true });
    let out = `<div class="post">
      <div class="meta">${autorHtml} • ${new Date(post.time||0).toLocaleString()}</div>
      <div>${escaparHtml(post.text)}</div>
      ${post.file ? `<div style="margin-top:8px;"><a href="${post.file.data}" target="_blank">${escaparHtml(post.file.name)}</a></div>` : ''}
      <div style="margin-top:8px;"><button class="btn small secondary" onclick="responderComentarioMural('${post.id}')">Responder</button></div>
      <div class="post-replies">${respostas.filter(r=>r.replyTo===post.id).map(r=>htmlPublicacao(r,true)).join('')}</div>
      <div class="reply-form-wrap" id="replyForm_${post.id}" style="display:none;margin-top:8px;">
        <textarea class="reply-text" placeholder="Responder..."></textarea>
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
          <label class="file-btn">Anexar arquivo
            <input class="reply-file-inp" type="file" style="display:none">
          </label>
          <button class="btn" onclick="enviarRespostaMural('${post.id}')">Enviar resposta</button>
          <span class="reply-anexadoFileInfo" style="font-size:.95em; color: #3a6b47; margin-left:14px;"></span>
        </div>
      </div>
    </div>`;
    return out;
  }
  function htmlPublicacao(p, isResposta){
    const autorHtml = htmlBadgeUsuario(p.author || '', { small: true });
    return `<div class="${isResposta?'post-reply':'post'}">
      <div class="meta">${autorHtml} • ${new Date(p.time||0).toLocaleString()}</div>
      <div>${escaparHtml(p.text)}</div>
      ${p.file ? `<div style="margin-top:7px;"><a href="${p.file.data}" target="_blank">${escaparHtml(p.file.name)}</a></div>` : ''}
    </div>`;
  }
  window.responderComentarioMural = function(postId){
    $$('#postsList .reply-form-wrap').forEach(x=>x.style.display='none');
    const f = $('#replyForm_'+postId);
    if (f) {
      f.style.display = 'block';
      const inp = f.querySelector('.reply-file-inp');
      const lbl = f.querySelector('.reply-anexadoFileInfo');
      if(inp) {
        inp.onchange = function(){
          lbl.textContent = inp.files.length ? inp.files[0].name : '';
        };
      }
    }
  };
  window.enviarRespostaMural = function(postId){
    const frm = $('#replyForm_'+postId);
    if(!frm) return;
    const txt = frm.querySelector('.reply-text').value.trim();
    const inpFile = frm.querySelector('.reply-file-inp');
    if(!txt && (!inpFile || !inpFile.files.length)) return alert('Escreva algo ou anexe um arquivo');
    const posts = ler(CHAVE_PUBLICACOES);
    if(inpFile && inpFile.files.length){
      const file = inpFile.files[0];
      const fr = new FileReader();
      fr.onload = function(e){
        posts.push({ id:'r_'+Date.now(), room:salaAberta, text:txt||'', file:{ name: file.name, data: e.target.result }, author:meuId(), time:Date.now(), replyTo:postId });
        gravar(CHAVE_PUBLICACOES, posts);
        renderizarAbaSala('mural');
      };
      fr.readAsDataURL(file);
    } else {
      posts.push({ id:'r_'+Date.now(), room:salaAberta, text:txt||'', file:null, author:meuId(), time:Date.now(), replyTo:postId });
      gravar(CHAVE_PUBLICACOES, posts);
      renderizarAbaSala('mural');
    }
  };
  function criarPublicacao(room) {
    const texto = $('#postText')?.value?.trim();
    const arquivoEl = $('#postFile');
    if (!texto && (!arquivoEl || !arquivoEl.files.length)) return alert('Escreva algo ou anexe um arquivo');
    const posts = ler(CHAVE_PUBLICACOES);
    const file = arquivoEl?.files[0];
    if (file) {
      const fr = new FileReader();
      fr.onload = e => {
        posts.push({ id: 'p_'+Date.now(), room, text: texto||'', file: { name: file.name, data: e.target.result }, author: meuId(), time: Date.now() });
        gravar(CHAVE_PUBLICACOES, posts);
        renderizarAbaSala('mural');
        adicionarNotificacao({ title: 'Novo post', text: `Há um novo post em ${room}` });
      };
      fr.readAsDataURL(file);
    } else {
      posts.push({ id: 'p_'+Date.now(), room, text: texto||'', file: null, author: meuId(), time: Date.now() });
      gravar(CHAVE_PUBLICACOES, posts);
      renderizarAbaSala('mural');
      adicionarNotificacao({ title: 'Novo post', text: `Há um novo post em ${room}` });
    }
  }
  function entrarSalaPorCodigo() {
    const codigo = ($('#joinRoomCode')?.value||'').toUpperCase().trim();
    if (!codigo) return alert('Insira o código');
    const salas = carregarSalas();
    const s = salas.find(x => x.code === codigo);
    if (!s) return alert('Código inválido');
    s.members = s.members || [];
    if (!s.members.includes(meuId())) s.members.push(meuId());
    salvarSalas(salas);
    if ($('#joinRoomCode')) $('#joinRoomCode').value='';
    $('#modalJoinRoom')?.setAttribute('aria-hidden','true');
    renderizarSalas(); renderizarAtividades();
    alert('Entrou na sala '+s.name);
    adicionarNotificacao({ title: 'Entrou em sala', text: `Você entrou na sala ${s.name}` });
  }
  function sairSala(code) {
    const salas = carregarSalas();
    const s = salas.find(x=>x.code===code);
    if (!s) return;
    s.members = (s.members||[]).filter(m=>m!==meuId());
    salvarSalas(salas);
    renderizarSalas();
    renderizarAtividades();
    if (salaAberta === code) renderizarAbaSala('mural');
    adicionarNotificacao({ title: 'Saiu da sala', text: `Você saiu da sala ${code}` });
  }
  function carregarAtividades(){ return ler(CHAVE_ATIVIDADES); }
  function salvarAtividades(a){ gravar(CHAVE_ATIVIDADES,a); }
  function criarAtividade() {
    if (!souProfessor()) return alert('Somente professores');
    const titulo = $('#activityTitle')?.value?.trim();
    const entrega = $('#activityDue')?.value;
    const maxVal = $('#activityMaxPoints')?.value;
    const max = (maxVal !== undefined && maxVal !== '') ? parseFloat(maxVal) : null;
    const desc = $('#activityDesc')?.value?.trim();
    const sala = $('#activityRoomSelect')?.value;
    if (!titulo || !entrega || !sala) return alert('Preencha título, data e sala');
    const arquivo = $('#activityAttachment');
    const acts = carregarAtividades();
    if (arquivo && arquivo.files[0]) {
      const f = arquivo.files[0];
      const fr = new FileReader();
      fr.onload = e => {
        acts.push({ id:'a_'+Date.now(), title: titulo, desc, due: entrega, room: sala, created: Date.now(), max, file:{name:f.name,data:e.target.result}, grades:{} });
        salvarAtividades(acts);
        renderizarAtividades();
        adicionarNotificacao({ title: 'Atividade criada', text: `${titulo} — Sala ${sala}` });
        mostrarArquivoAtividade(f.name);
      };
      fr.readAsDataURL(f);
    } else {
      acts.push({ id:'a_'+Date.now(), title: titulo, desc, due: entrega, room: sala, created: Date.now(), max, file:null, grades:{} });
      salvarAtividades(acts);
      renderizarAtividades();
      adicionarNotificacao({ title: 'Atividade criada', text: `${titulo} — Sala ${sala}` });
      mostrarArquivoAtividade('');
    }
  }
  function mostrarArquivoAtividade(nome){
    const el = document.getElementById('arquivo-anexado-info');
    if (el) el.textContent = nome ? 'Anexado: '+nome : '';
  }
  function renderizarAtividades() {
    const atos = carregarAtividades();
    if ($('#activitiesList')) {
      $('#activitiesList').innerHTML = atos.length ? atos.map(a => htmlLinhaAtividade(a)).join('') : '<p class="muted">Sem atividades</p>';
    }
    if ($('#activitiesListStudent')) {
      const salas = carregarSalas();
      const entradas = salas.filter(r => (r.members||[]).includes(meuId())).map(r=>r.code);
      const lista = atos.filter(a => entradas.includes(a.room));
      $('#activitiesListStudent').innerHTML = lista.length ? lista.map(a=>htmlLinhaAtividade(a)).join('') : '<p class="muted">Nenhuma atividade disponível</p>';
    }
    renderizarCalendario();
  }
  function htmlLinhaAtividade(a) {
  return `<div class="activity-row">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;">
      <div style="flex:1;">
        <strong>${escaparHtml(a.title)}</strong>
        <div class="muted">${escaparHtml(a.due)} • Sala: ${escaparHtml(a.room)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="btn small" style="margin-left:10px" onclick="abrirAtividade('${a.id}')">Abrir</button>
        ${souProfessor() ? `<button class="btn small secondary" onclick="excluirAtividade('${a.id}')">Excluir</button>` : ''}
      </div>
    </div>
  </div>`;
}
function abrirAtividade(id) {
  const a = carregarAtividades().find(x => x.id === id);
  if (!a) return alert('Atividade não encontrada');
  const cont = $('#roomDetailsContent');
  if (!cont) return;
  let html = `<h3>${escaparHtml(a.title)} ${a.max!=null? '• '+a.max+' pts':''}</h3>
    <div class="muted">Entrega: ${escaparHtml(a.due)} • Sala: ${escaparHtml(a.room)}</div>
    <p>${escaparHtml(a.desc||'')}</p>`;
  if (a.file) html += `<div><a href="${a.file.data}" target="_blank">${escaparHtml(a.file.name)}</a></div>`;
  if (!souProfessor()) {
    const sub = ler(CHAVE_SUBMISSOES).find(s => s.activity === id && s.student === meuId());
    if (sub) 
      html += `<div class="muted">Enviado: ${new Date(sub.time).toLocaleDateString()} • <a href="${sub.file.data}" download="${sub.file.name}">${escaparHtml(sub.file.name)}</a></div>
      ${sub.textoMsg? `<div class="muted">Mensagem enviada: ${escaparHtml(sub.textoMsg)}</div>` : ''}`;
    else
      html += `<label class="file-btn">Enviar arquivo<input type="file" id="studentFile" style="display:none"></label>
        <textarea id="studentMsg" placeholder="Mensagem para o professor (opcional)" style="width:100%;margin-top:8px"></textarea>
        <div style="margin-top:8px"><button class="btn" onclick="enviarSubmissao('${id}')">Entregar</button></div>`;
    const nota = a.grades && a.grades[meuId()];
    if (nota != null) html += `<div style="margin-top:16px;"><strong>Sua nota:</strong> <span style="color:#097d48;font-size:1.2em">${nota}/${a.max??'-'}</span></div>`;
  } else {
    const s = carregarSalas().find(rr => rr.code === a.room);
    const alunos = s ? s.members || [] : [];
    html += `<h4>Submissões</h4>`;
    alunos.forEach(sid => {
      const sub = ler(CHAVE_SUBMISSOES).find(x => x.activity === id && x.student === sid);
      const nota = a.grades && a.grades[sid];
      const labelAluno = htmlBadgeUsuario(sid, { small: true });
      html += `<div style="padding:6px 0;border-bottom:1px solid #eee;">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">${labelAluno} - ${sub ? (
              `<a href="${sub.file.data}" download="${sub.file.name}">${escaparHtml(sub.file.name)}</a> ${sub.textoMsg? `<span class="muted">Mensagem: ${escaparHtml(sub.textoMsg)}</span>` : ''}`) 
           : '<span class="muted">Sem envio</span>'}
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" id="g_${id}_${sid}" placeholder="Nota" style="width:80px">
            <button class="btn small" onclick="lancarNota('${id}','${sid}')">Salvar</button>
            ${nota != null ? `<span class="muted">• ${nota}/${a.max??'-'}</span>` : ''}
          </div>
        </div>
      </div>`;
    });
  }
  $('#modalRoomDetails')?.setAttribute('aria-hidden','false');
  $('#roomDetailsContent').innerHTML = html;
}

  function enviarSubmissao(activityId) {
  const input = $('#studentFile');
  const msgEl = $('#studentMsg');
  const msg = msgEl ? msgEl.value.trim() : '';
  if (!input || !input.files.length) return alert('Escolha um arquivo');
  const f = input.files[0];
  const fr = new FileReader();
  fr.onload = e => {
    const subs = ler(CHAVE_SUBMISSOES);
    const existente = subs.findIndex(s=>s.activity===activityId && s.student===meuId());
    const payload = { id:'s_'+Date.now(), activity: activityId, student: meuId(), time: Date.now(), file: {name:f.name, data:e.target.result}, textoMsg: msg };
    if (existente >= 0) subs[existente] = payload; else subs.push(payload);
    gravar(CHAVE_SUBMISSOES, subs);
    renderizarAtividades();
    alert('Enviado');
    $('#modalRoomDetails')?.setAttribute('aria-hidden','true');
    adicionarNotificacao({ title: 'Submissão enviada', text: `Você enviou uma submissão para a atividade ${activityId}` });
  };
  fr.readAsDataURL(f);
}
  function lancarNota(activityId, studentId) {
    const inpt = $(`#g_${activityId}_${studentId}`);
    if (!inpt) return;
    const val = parseFloat(inpt.value);
    if (isNaN(val)) return alert('Nota inválida');
    const atos = carregarAtividades();
    const a = atos.find(x=>x.id===activityId);
    if (!a) return;
    a.grades = a.grades || {};
    a.grades[studentId] = val;
    salvarAtividades(atos);
    alert('Nota salva');
    renderizarAtividades();
    adicionarNotificacao({ title: 'Nota lançada', text: `Nota para ${studentId} na atividade ${activityId}: ${val}` });
  }
  function renderizarCalendario() {
    const container = $('#calendarContainer') || $('#calendarContainerStudent');
    if (!container) return;
    const year = dataCalendario.getFullYear(), month = dataCalendario.getMonth();
    const dateRef = new Date(year, month, 1);
    let dow = dateRef.getDay();
    const days = new Date(year, month+1, 0).getDate();
    let html = `<div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <button class="btn small" onclick="mesAnterior()">◀</button>
        <strong>${dataCalendario.toLocaleString(undefined,{month:'long',year:'numeric'})}</strong>
        <button class="btn small" onclick="proximoMes()">▶</button>
      </div>
      <div class="muted">Clique em evento</div>
    </div>`;
    html += '<div class="calendar"><div style="font-weight:700">Dom</div><div style="font-weight:700">Seg</div><div style="font-weight:700">Ter</div><div style="font-weight:700">Qua</div><div style="font-weight:700">Qui</div><div style="font-weight:700">Sex</div><div style="font-weight:700">Sáb</div>';
    for(let i=0;i<dow;i++) html += `<div class="day empty"></div>`;
    for(let d=1;d<=days;d++){
      const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const events = carregarAtividades().filter(a => a.due === iso);
      html += `<div class="day"><div class="date">${d}</div>${events.map(ev=>`<div class="event-pill" onclick="renderizarAgenda('${iso}')">${escaparHtml(ev.title)}</div>`).join('')}</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }
  function formatarDataIso(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
  function mesAnterior(){ dataCalendario = new Date(dataCalendario.getFullYear(), dataCalendario.getMonth()-1, 1); renderizarCalendario(); }
  function proximoMes(){ dataCalendario = new Date(dataCalendario.getFullYear(), dataCalendario.getMonth()+1, 1); renderizarCalendario(); }
  function renderizarAgenda(iso){ const alvo = $('#agendaList') || $('#agendaListStudent'); if (!alvo) return; const atos = carregarAtividades().filter(a=>a.due===iso); alvo.innerHTML = `<h4>${formatarDataIso(iso)}</h4>${atos.length?atos.map(a=>`<div>${escaparHtml(a.title)}</div>`).join(''):'<p class="muted">Sem atividades</p>'}`;}
  function carregarNotificacoes(){ return ler(CHAVE_NOTIFICACOES); }
  function salvarNotificacoes(n){ gravar(CHAVE_NOTIFICACOES,n); }
  function adicionarNotificacao(payload){
    const nots = carregarNotificacoes();
    const n = { id: 'n_'+Date.now(), title: payload.title||'Notificação', text: payload.text||'', time: Date.now(), read: false };
    nots.unshift(n);
    salvarNotificacoes(nots);
    renderizarNotificacoes();
  }
  function renderizarNotificacoes(){
    const nots = carregarNotificacoes();
    const naoLidas = nots.filter(n=>!n.read).length;
    const badge = $('#notifBadge');
    const dropdown = $('#notifDropdown');
    if (badge) {
      if (naoLidas > 0) { badge.textContent = naoLidas > 9 ? '9+' : String(naoLidas); badge.style.display = 'flex'; }
      else { badge.textContent = ''; badge.style.display = 'none'; }
    }
    if (dropdown) {
      dropdown.innerHTML = `<div class="notif-header"><strong>Notificações     </strong><button class="btn small secondary" id="markReadBtn">Marcar todas como lidas</button></div><div class="notif-list">${nots.length?nots.map(n=>`<div class="notif-item"><strong>${escaparHtml(n.title)}</strong><div>${escaparHtml(n.text)}</div><span class="muted small">${new Date(n.time).toLocaleString()}</span></div>`).join(''):'<div class="muted">Nenhuma notificação</div>'}</div>`;
      const mr = $('#markReadBtn');
      if (mr) mr.onclick = () => { apagarTodasNotificacoes(); };
    }
  }
  function apagarTodasNotificacoes(){
    gravar(CHAVE_NOTIFICACOES, []);
    renderizarNotificacoes();
  }
  function renderizarBadgeUsuario() {
    const badge = $('#userBadge');
    if (!badge) return;
    const cur = JSON.parse(localStorage.getItem('sd_current_user') || 'null');
    if (cur) {
      const nome = escaparHtml(cur.nome || cur.username || 'Usuário');
      const tipoNorm = (String(cur.tipo || '').toLowerCase() === 'professor') ? 'professor' : 'aluno';
      const rotulo = tipoNorm === 'professor' ? 'Prof.' : 'Aluno';
      badge.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:36px;height:36px;border-radius:999px;background:#6C545C;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:1.2rem;">${nome[0]}</span><span style="font-weight:600;color:#333">${nome}</span></span>`;
      badge.title = `${nome} (${rotulo})`;
      const trn = $('#topRightName');
      if (trn) trn.textContent = nome;
    } else {
      badge.innerHTML = `<span class="muted">Convidado</span>`;
      badge.title = 'Convidado';
      const trn = $('#topRightName');
      if (trn) trn.textContent = '';
    }
  }
  function normalizarChave(s) {
    if (!s) return '';
    try { return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^\w-]/g,'').replace(/\s+/g,'-'); }
    catch(e) { return s.toLowerCase().replace(/[^\w-]/g,'').replace(/\s+/g,'-'); }
  }
  function sincronizarLateralAtiva(id) {
    $$('.side-item').forEach(btn => {
      const ds = btn.dataset.section;
      if (ds) {
        btn.classList.toggle('active', ds === id);
        return;
      }
      const attr = btn.getAttribute('onclick') || '';
      const m = attr.match(/mostrarSecao\(['"]?([^'")]+)['"]?\)/);
      if (m && m[1]) {
        btn.classList.toggle('active', m[1] === id);
        return;
      }
      const txt = normalizarChave((btn.textContent || '').trim());
      btn.classList.toggle('active', txt === normalizarChave(id));
    });
  }
  function sairSistema(){
    if (typeof window.appLogout === 'function') {
      window.appLogout(false);
    } else {
      window.location.href = 'index.html';
    }
  }
  window.alternarSidebar = () => $('.sidebar')?.classList.toggle('hidden');
  window.mostrarSecao = id => {
    if (!id) return;
    const panels = $$('.panel');
    if (!panels.length) return;
    panels.forEach(p=>p.classList.toggle('active', p.id===id));
    sincronizarLateralAtiva(id);
    if (id==='agenda') renderizarCalendario();
    if (id==='materiais') renderizarMateriais();
  };
  window.abrirSala = abrirSala;
  window.fecharVisualizacaoSala = fecharVisualizacaoSala;
  window.abrirModalCriarSala = () => $('#modalCreateRoom')?.setAttribute('aria-hidden','false');
  window.fecharModalCriarSala = () => $('#modalCreateRoom')?.setAttribute('aria-hidden','true');
  window.criarSala = criarSala;
  window.abrirModalEntrarSala = () => $('#modalJoinRoom')?.setAttribute('aria-hidden','false');
  window.fecharModalEntrarSala = () => $('#modalJoinRoom')?.setAttribute('aria-hidden','true');
  window.entrarSalaPorCodigo = entrarSalaPorCodigo;
  window.sairSala = sairSala;
  window.renderizarAbaSala = renderizarAbaSala;
  window.criarPublicacao = criarPublicacao;
  window.criarAtividade = criarAtividade;
  window.renderizarAtividades = renderizarAtividades;
  window.abrirAtividade = abrirAtividade;
  window.enviarSubmissao = enviarSubmissao;
  window.lancarNota = lancarNota;
  window.mesAnterior = mesAnterior;
  window.proximoMes = proximoMes;
  window.renderizarAgenda = renderizarAgenda;
  window.sair = sairSistema;
  window.fecharDetalhesSala = fecharDetalhesSala;
  window.excluirSala = excluirSala;
  window.excluirAtividade = id => { if (!confirm('Excluir?')) return; gravar(CHAVE_ATIVIDADES, carregarAtividades().filter(a=>a.id!==id)); renderizarAtividades(); };
  window.adicionarNotificacao = adicionarNotificacao;
  window.renderizarNotificacoes = renderizarNotificacoes;
  function carregarMateriais() {
    return JSON.parse(localStorage.getItem(CHAVE_MATERIAIS) || '[]');
  }
  function salvarMateriais(arr) {
    localStorage.setItem(CHAVE_MATERIAIS, JSON.stringify(arr));
    renderizarMateriais();
  }
  function anexarMaterial() {
    const titleEl = document.getElementById('materialTitle');
    const fileEl = document.getElementById('materialFile');
    const title = titleEl && titleEl.value.trim();
    if (!title || !fileEl || !fileEl.files.length) return alert('Preencha o título e selecione o arquivo.');
    const file = fileEl.files[0];
    const materials = carregarMateriais();
    const reader = new FileReader();
    reader.onload = function(e) {
      materials.push({ nome: title, filename: file.name, url: e.target.result });
      salvarMateriais(materials);
      if (titleEl) titleEl.value = '';
      if (fileEl) fileEl.value = '';
      adicionarNotificacao({ title: 'Material anexado', text: `${title} (${file.name}) anexado.` });
      mostrarUltimoMaterialAnexado(file.name);
    };
    reader.readAsDataURL(file);
  }
  function mostrarUltimoMaterialAnexado(nome){
    const el = document.getElementById('arquivo-anexado-info');
    if (el) el.textContent = nome ? 'Anexado: '+nome : '';
  }
  function renderizarMateriais() {
    const ul = document.getElementById('material-attach-list');
    if (ul) {
      const arr = carregarMateriais();
      ul.innerHTML = arr.length ? arr.map(m => `<li><a href="${m.url}" target="_blank">${m.nome} (${m.filename})</a></li>`).join('') : '<li class="muted">Nenhum anexo enviado</li>';
    }
  }
  window.anexarMaterial = anexarMaterial;
  window.renderizarMateriais = renderizarMateriais;
  document.addEventListener('DOMContentLoaded', renderizarMateriais);
  function iniciar(){
    renderizarBadgeUsuario();
    if (!souProfessor()) $$('.prof-only').forEach(el=>el.remove());
    $$('.side-item').forEach(btn => {
      const ds = btn.dataset.section;
      if (ds) {
        btn.addEventListener('click', (e) => { e.preventDefault(); mostrarSecao(ds); });
      } else {
        btn.addEventListener('click', (e) => {
          const attr = btn.getAttribute('onclick') || '';
          const m = attr.match(/mostrarSecao\(['"]?([^'")]+)['"]?\)/);
          if (m && m[1]) return mostrarSecao(m[1]);
          const txt = normalizarChave((btn.textContent || '').trim());
          mostrarSecao(txt);
        });
      }
    });
    renderizarSalas();
    renderizarAtividades();
    renderizarCalendario();
    renderizarMateriais();
    const ativo = $$('.panel').find(p => p.classList.contains('active'));
    if (ativo) sincronizarLateralAtiva(ativo.id);
    $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target===m) m.setAttribute('aria-hidden','true'); }));
    if (!localStorage.getItem(CHAVE_NOTIFICACOES)) salvarNotificacoes([]);
    renderizarNotificacoes();
    const wrap = $('#notifWrap');
    const dropdown = $('#notifDropdown');
    if (wrap && dropdown) {
      wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = dropdown.classList.toggle('open');
        dropdown.setAttribute('aria-hidden', !open);
      });
      document.addEventListener('click', () => { if (dropdown.classList.contains('open')) { dropdown.classList.remove('open'); dropdown.setAttribute('aria-hidden','true'); } });
    }
    window.addEventListener('storage', (ev) => {
      if (!ev.key) return;
      if (['sd_current_user'].includes(ev.key)) renderizarBadgeUsuario();
      if ([CHAVE_SALAS].includes(ev.key)) renderizarSalas();
      if ([CHAVE_ATIVIDADES, CHAVE_SUBMISSOES, CHAVE_PUBLICACOES].includes(ev.key)) renderizarAtividades();
      if ([CHAVE_NOTIFICACOES].includes(ev.key)) renderizarNotificacoes();
      if ([CHAVE_MATERIAIS].includes(ev.key)) renderizarMateriais();
    });
    const salasExistem = carregarSalas().length;
    if (!salasExistem && souProfessor()) {
      salvarSalas(sample);
      renderizarSalas();
    }
  }
  document.addEventListener('DOMContentLoaded', iniciar);

})();
