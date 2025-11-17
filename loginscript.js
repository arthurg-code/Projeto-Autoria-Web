(function(){
  const $ = s => document.querySelector(s);
  const ler = k => JSON.parse(localStorage.getItem(k) || '[]');
  const gravar = (k,v) => localStorage.setItem(k, JSON.stringify(v));

  function gerarId(){ return 'u_' + Math.random().toString(36).slice(2,9); }

  function obterSenhaDoFormulario(prefixCandidates = ['#senhaReg', '#senha']) {
    for (const sel of prefixCandidates) {
      const el = document.querySelector(sel);
      if (el) return el.value;
    }
    const reg = $('#registerForm');
    if (reg) {
      const p = reg.querySelector('input[type="password"]');
      if (p) return p.value;
    }
    return '';
  }

  const formCadastro = $('#registerForm');
  if (formCadastro) {
    formCadastro.addEventListener('submit', function(e){
      e.preventDefault();
      const tipo = $('#tipoContaReg') ? $('#tipoContaReg').value : (document.querySelector('select[name="tipo-conta"]')?.value || 'aluno');
      const nome = $('#nomeReg') ? $('#nomeReg').value.trim() : (document.querySelector('input[name="nome"]')?.value || '').trim();
      const username = $('#usuarioReg') ? $('#usuarioReg').value.trim() : (document.querySelector('input[name="usuario"]')?.value || '').trim();
      const password = obterSenhaDoFormulario();

      if (!username || !password || !nome) return alert('Preencha todos os campos');

      const usuarios = ler('sd_users');
      if (usuarios.some(u => u.username === username)) {
        return alert('Nome de usuário já existe. Escolha outro.');
      }

      const id = gerarId();
      const novo = { id, tipo, username, password, nome };
      usuarios.push(novo);
      gravar('sd_users', usuarios);

      localStorage.setItem('sd_current_user', JSON.stringify({
        id: novo.id,
        tipo: novo.tipo,
        username: novo.username,
        nome: novo.nome
      }));
      localStorage.setItem('sd_user_simple', novo.id);

      if ((String(novo.tipo || '').toLowerCase()) === 'aluno') {
        window.location.href = 'dashboard_aluno.html';
      } else {
        window.location.href = 'dashboard_prof.html';
      }
    });
  }

  window.entrar = function() {
    try { event && event.preventDefault(); } catch(e){}
    const tipo = $('#tipoconta') ? $('#tipoconta').value : (document.querySelector('select[name="tipoconta"]')?.value || 'aluno');
    const username = $('#usuario') ? $('#usuario').value.trim() : (document.querySelector('input[name="usuario"]')?.value || '').trim();
    const password = $('#senha') ? $('#senha').value : (document.querySelector('input[type="password"]')?.value || '');

    const usuarios = ler('sd_users');
    const contasDemo = [
      { id: 'demo_aluno', tipo: 'aluno', username: 'aluno', password: 'aluno', nome: 'Aluno Demo' },
      { id: 'demo_prof', tipo: 'professor', username: 'admin', password: 'admin', nome: 'Professor Demo' }
    ];
    const todos = usuarios.concat(contasDemo);

    const usr = todos.find(u => u.username === username && u.password === password && u.tipo === tipo);
    if (!usr) {
      alert('Login ou senha incorretos.');
      return false;
    }

    localStorage.setItem('sd_current_user', JSON.stringify({
      id: usr.id,
      tipo: usr.tipo,
      username: usr.username,
      nome: usr.nome
    }));
    localStorage.setItem('sd_user_simple', usr.id);

    if ((String(usr.tipo || '').toLowerCase()) === 'aluno') {
      window.location.href = 'dashboard_aluno.html';
    } else {
      window.location.href = 'dashboard_prof.html';
    }
    return false;
  };

  window.alternarMostrarSenha = function(){
    const pw = document.querySelector('input[type="password"], input#senha, input#senhaReg');
    if (!pw) return;
    pw.type = (pw.type === 'password') ? 'text' : 'password';
  };

  window.sair = function(clearUserId = false) {
    localStorage.removeItem('sd_current_user');
    if (clearUserId) localStorage.removeItem('sd_user_simple');
    window.location.href = 'index.html';
  };

  const formLogin = $('#loginForm');
  if (formLogin) {
    formLogin.addEventListener('submit', function(e){
      e.preventDefault();
      window.entrar();
    });
  }
})();