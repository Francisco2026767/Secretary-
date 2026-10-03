export function setupCalls(getPatients, getDoctors) {
  const list = document.getElementById('callList');
  const log = JSON.parse(localStorage.getItem('callLog')) || [];

  function renderLog() {
    const section = document.getElementById('callLog');
    section.replaceChildren();
    if (!log.length) {
      const empty = document.createElement('p');
      empty.className = 'empty'; empty.textContent = 'Nenhuma chamada registada.';
      section.append(empty); return;
    }
    log.slice().reverse().forEach(entry => {
      const div = document.createElement('div');
      div.className = 'call-entry';
      const info = document.createElement('div');
      info.innerHTML = `<strong>${escapeHtml(entry.name)}</strong><span class="small">📞 ${escapeHtml(entry.phone)} · ${new Date(entry.time).toLocaleString('pt-PT')}</span>`;
      const redial = document.createElement('a');
      redial.className = 'btn secondary'; redial.textContent = 'Ligar novamente';
      redial.href = `tel:${entry.phone.replace(/\s/g, '')}`;
      div.append(info, redial); section.append(div);
    });
  }

  function saveLog() { localStorage.setItem('callLog', JSON.stringify(log)); renderLog(); }

  function makeCall(name, phone) {
    if (!phone) return false;
    log.push({ name, phone, time: new Date().toISOString() });
    saveLog();
    return true;
  }

  function render() {
    list.replaceChildren();
    const contacts = [
      ...getPatients().filter(p => p.phone).map(p => ({ name: p.name, phone: p.phone, type: 'Paciente' })),
      ...getDoctors().filter(d => d.phone).map(d => ({ name: d.name, phone: d.phone, type: 'Médico' }))
    ];
    if (!contacts.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Nenhum contacto com telefone registado.';
      list.append(empty); return;
    }
    contacts.forEach(contact => {
      const div = document.createElement('div');
      div.className = 'call-contact';
      div.innerHTML = `<div><strong>${escapeHtml(contact.name)}</strong><span class="small">${escapeHtml(contact.type)} · 📞 ${escapeHtml(contact.phone)}</span></div>`;
      const link = document.createElement('a');
      link.className = 'btn'; link.textContent = 'Ligar';
      link.href = `tel:${contact.phone.replace(/\s/g, '')}`;
      div.append(link); list.append(div);
    });
  }

  render(); renderLog();
  return { render, makeCall };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&').replace(/</g, '<')
    .replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#39;');
}
