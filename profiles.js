import { historySummary } from './patient-history.js';

const dialog = document.getElementById('profileDialog');
const content = document.getElementById('profileContent');
document.getElementById('closeProfile').addEventListener('click', () => dialog.close());

function heading(text, tag = 'h3') {
  const element = document.createElement(tag); element.textContent = text;
  content.append(element);
}
function entries(items) {
  const list = document.createElement('dl'); list.className = 'profile-details';
  for (const [label, value] of items) {
    const term = document.createElement('dt'); term.textContent = label;
    const description = document.createElement('dd'); description.textContent = value;
    list.append(term, description);
  }
  content.append(list);
}
function visits(title, items, describe) {
  heading(title);
  if (!items.length) { const p = document.createElement('p'); p.textContent = 'Nenhum registo.'; content.append(p); return; }
  const list = document.createElement('ul'); list.className = 'profile-visits';
  items.forEach(item => { const li = document.createElement('li'); li.textContent = describe(item); list.append(li); });
  content.append(list);
}
const dateLabel = date => date && date !== '—' ? date.split('-').reverse().join('/') : 'Sem data';

export function openPatientProfile(patient, appointments, walkins) {
  content.replaceChildren();
  document.getElementById('profileTitle').textContent = `Perfil do paciente · ${patient.name}`;
  entries([['Nome', patient.name], ['Telefone', patient.phone || 'Não indicado']]);
  heading('Antecedentes'); entries(historySummary(patient.history));
  const matches = item => item.name.toLowerCase() === patient.name.toLowerCase();
  visits('Consultas', appointments.filter(matches), a => `${dateLabel(a.date)} · ${a.time} · ${a.type} · ${a.doctor} · ${a.status}${a.notes ? ' · ' + a.notes : ''}`);
  visits('Walk-ins', walkins.filter(matches), w => `${dateLabel(w.date)} · ${w.time} · ${w.reason} · ${w.status}${w.notes ? ' · ' + w.notes : ''}`);
  dialog.showModal();
}
export function openDoctorProfile(doctor, appointments) {
  content.replaceChildren();
  document.getElementById('profileTitle').textContent = `Perfil do médico · ${doctor.name}`;
  entries([['Nome', doctor.name], ['Especialidade', doctor.specialty || 'Não indicada'], ['Telefone', doctor.phone || 'Não indicado'], ['Email', doctor.email || 'Não indicado']]);
  visits('Consultas associadas', appointments.filter(a => a.doctor === doctor.name), a => `${dateLabel(a.date)} · ${a.time} · ${a.name} · ${a.type} · ${a.status}`);
  dialog.showModal();
}
