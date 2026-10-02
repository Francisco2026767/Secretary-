export function setupMessages(toast) {
  const messages = JSON.parse(localStorage.getItem('clinicMessages')) || [];
  const list = document.getElementById('messageList');
  const button = document.getElementById('sendMessage');
  function render() {
    list.replaceChildren();
    if (!messages.length) {
      const empty = document.createElement('p'); empty.className = 'empty';
      empty.textContent = 'Nenhuma mensagem registada.'; list.append(empty);
    }
    messages.forEach(message => {
      const article = document.createElement('article');
      article.className = `message ${message.role === 'assistant' ? 'reply' : ''}`;
      const label = document.createElement('strong');
      label.textContent = message.role === 'assistant' ? `Assistente IA · resposta a ${message.recipient}` : `Secretariado → ${message.recipient}`;
      const time = document.createElement('div'); time.className = 'small';
      time.textContent = new Date(message.createdAt).toLocaleString('pt-PT');
      const text = document.createElement('p'); text.textContent = message.text;
      article.append(label, time, text); list.append(article);
    });
  }
  function save() { localStorage.setItem('clinicMessages', JSON.stringify(messages)); render(); }
  async function updateStatus() {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) throw new Error();
      const config = await response.json();
      document.getElementById('aiStatus').textContent = config.aiConfigured ? 'IA configurada. As respostas são geradas automaticamente e devem ser revistas.' : 'IA por configurar: adiciona a chave do serviço no painel de credenciais.';
    } catch {
      document.getElementById('aiStatus').textContent = 'Serviço de IA indisponível neste momento.';
    }
  }
  let lastFailed = null;
  let sending = false;
  button.addEventListener('click', async () => {
    if (sending) return;
    const recipient = document.getElementById('messageRecipient').value.trim();
    const text = document.getElementById('messageText').value.trim();
    if (!recipient || !text) return toast('Preencha o destinatário e a mensagem.');
    if (recipient.length > 150 || text.length > 4000) return toast('Mensagem demasiado longa (máximo 4000 caracteres).');
    sending = true; button.disabled = true; button.textContent = 'A gerar resposta…';
    document.getElementById('messageError').textContent = '';
    if (!lastFailed || lastFailed.recipient !== recipient || lastFailed.text !== text) {
      messages.push({ role: 'user', recipient, text, createdAt: new Date().toISOString() }); save();
    }
    try {
      const response = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Clinic-Request': '1' },
        body: JSON.stringify({ recipient, message: text }), signal: AbortSignal.timeout(45000)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível gerar a resposta.');
      messages.push({ role: 'assistant', recipient, text: data.reply, createdAt: new Date().toISOString() }); save();
      lastFailed = null;
      document.getElementById('messageText').value = '';
      toast('Resposta da IA recebida.');
    } catch (error) {
      lastFailed = { recipient, text };
      document.getElementById('messageError').textContent = error.name === 'TimeoutError' ? 'A resposta demorou demasiado. Tenta novamente.' : error.message;
      toast('Não foi recebida uma resposta. Podes tentar novamente.');
    } finally {
      sending = false; button.disabled = false; button.textContent = 'Enviar e receber resposta';
    }
  });
  render(); updateStatus();
  document.querySelector('[data-page="messages"]').addEventListener('click', updateStatus);
}
