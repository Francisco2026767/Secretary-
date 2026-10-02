const sections = [
  { key: 'surgeries', label: 'Já teve cirurgias?', details: 'Quais cirurgias e quando?', count: 'Quantas cirurgias?' },
  { key: 'hospitalizations', label: 'Já foi hospitalizado?', details: 'Motivos e datas dos internamentos', count: 'Quantas vezes foi hospitalizado?' },
  { key: 'allergies', label: 'Tem alergias?', details: 'Quais alergias e reações?' }
];

export function createHistoryForm(prefix, container) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'history-form field full';
  const legend = document.createElement('legend');
  legend.textContent = 'Antecedentes do paciente — apenas dados fictícios';
  fieldset.append(legend);
  for (const section of sections) {
    const group = document.createElement('div');
    group.className = 'history-group';
    const id = `${prefix}-${section.key}`;
    const label = document.createElement('label');
    label.htmlFor = id; label.textContent = section.label;
    const select = document.createElement('select');
    select.id = id;
    for (const [value, text] of [['', 'Não indicado'], ['no', 'Não'], ['yes', 'Sim']]) {
      select.add(new Option(text, value));
    }
    const details = document.createElement('div');
    details.className = 'history-details'; details.hidden = true;
    if (section.count) {
      const countLabel = document.createElement('label');
      countLabel.htmlFor = `${id}-count`; countLabel.textContent = section.count;
      const count = document.createElement('input');
      count.type = 'number'; count.min = '1'; count.step = '1'; count.id = `${id}-count`;
      details.append(countLabel, count);
    }
    const detailsLabel = document.createElement('label');
    detailsLabel.htmlFor = `${id}-details`; detailsLabel.textContent = section.details;
    const text = document.createElement('textarea');
    text.id = `${id}-details`; text.maxLength = 2000;
    details.append(detailsLabel, text);
    select.addEventListener('change', () => { details.hidden = select.value !== 'yes'; });
    group.append(label, select, details);
    fieldset.append(group);
  }
  const otherLabel = document.createElement('label');
  otherLabel.htmlFor = `${prefix}-other`; otherLabel.textContent = 'Outros antecedentes relevantes';
  const other = document.createElement('textarea');
  other.id = `${prefix}-other`; other.maxLength = 2000;
  other.placeholder = 'Por exemplo, medicação habitual ou outros antecedentes fictícios.';
  fieldset.append(otherLabel, other);
  container.append(fieldset);

  return {
    read() {
      const history = {};
      for (const section of sections) {
        const id = `${prefix}-${section.key}`;
        const answer = document.getElementById(id).value;
        const details = answer === 'yes' ? document.getElementById(`${id}-details`).value.trim() : '';
        const count = answer === 'yes' && section.count ? Number(document.getElementById(`${id}-count`).value) : null;
        if (answer === 'yes' && (!details || (section.count && (!Number.isInteger(count) || count < 1)))) {
          throw new Error(`Preencha os detalhes${section.count ? ' e a quantidade' : ''}: ${section.label}`);
        }
        history[section.key] = { answer, details, count };
      }
      history.other = other.value.trim();
      return sections.some(s => history[s.key].answer) || history.other ? history : null;
    },
    fill(history) {
      for (const section of sections) {
        const id = `${prefix}-${section.key}`;
        document.getElementById(id).value = history?.[section.key]?.answer || '';
        document.getElementById(`${id}-details`).value = history?.[section.key]?.details || '';
        if (section.count) document.getElementById(`${id}-count`).value = history?.[section.key]?.count ?? '';
        document.getElementById(`${id}-details`).parentElement.hidden = history?.[section.key]?.answer !== 'yes';
      }
      other.value = history?.other || '';
    }
  };
}

export function historySummary(history) {
  const entries = sections.map(section => {
    const data = history?.[section.key];
    const answer = data?.answer === 'yes' ? 'Sim' : data?.answer === 'no' ? 'Não' : 'Não indicado';
    return [section.label, `${answer}${data?.answer === 'yes' ? `${data.count ? ` · ${data.count} vez(es)` : ''} · ${data.details || 'Sem detalhes'}` : ''}`];
  });
  entries.push(['Outros antecedentes', history?.other || 'Não indicados']);
  return entries;
}
