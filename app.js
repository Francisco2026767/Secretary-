import { createHistoryForm } from './patient-history.js';
import { openPatientProfile, openDoctorProfile } from './profiles.js';
import { setupAgenda } from './agenda.js';
import { setupCalls } from './calls.js';

const $ = id => document.getElementById(id);
let refreshAgenda;
const bookingHistory = createHistoryForm('booking', document.querySelector('#appointments .form'));
const walkinHistory = createHistoryForm('walkin', document.querySelector('#walkins .form'));
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
let patients = JSON.parse(localStorage.getItem('patients')) || [];
let walkins = JSON.parse(localStorage.getItem('walkins')) || [];
let doctors = JSON.parse(localStorage.getItem('doctors')) || [
  { name: 'Dr. Miguel Silva', specialty: 'Medicina Geral', phone: '', email: '' }
];

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === id));
  document.querySelectorAll('.nav').forEach(n => n.classList.toggle('active', n.dataset.page === id));
}
document.querySelectorAll('.nav').forEach(n => n.addEventListener('click', event => {
  event.preventDefault();
  showPage(n.dataset.page);
}));
document.querySelectorAll('[data-show]').forEach(b => b.addEventListener('click', () => showPage(b.dataset.show)));
$('date').textContent = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

function save() {
  for (const [key, value] of Object.entries({ appointments, patients, walkins, doctors })) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  refreshAgenda?.();
}
let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').style.display = 'block';
  toastTimer = setTimeout(() => { $('toast').style.display = 'none'; }, 2500);
}
function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function clearFields(ids) { ids.forEach(id => { $(id).value = ''; }); }
function emptyRow(text, columns) { return `<tr><td colspan="${columns}" class="empty">${text}</td></tr>`; }

function renderDoctors() {
  $('doctorList').innerHTML = doctors.length ? '' : '<div class="empty">Nenhum médico registado.</div>';
  $('newDoctor').innerHTML = '<option value="">Selecionar profissional</option>';
  doctors.forEach((doctor, index) => {
    const div = document.createElement('div');
    div.className = 'doctor-card';
    div.innerHTML = `<button class="doctor-info profile-link" aria-label="Ver perfil de ${escapeHtml(doctor.name)}"><strong>${escapeHtml(doctor.name)}</strong>
      <div class="small">${escapeHtml(doctor.specialty || 'Especialidade não indicada')}</div>
      <div class="small">${escapeHtml(doctor.phone || 'Sem telefone')}${doctor.email ? ' · ' + escapeHtml(doctor.email) : ''}</div></button>
      <a class="btn secondary call-btn">Ligar</a><button class="btn danger">Excluir</button>`;
    if (doctor.phone) div.querySelector('.call-btn').href = `tel:${doctor.phone.replace(/\s/g, '')}`;
    div.querySelector('.call-btn').addEventListener('click', () => calls.makeCall(doctor.name, doctor.phone));
    div.querySelector('.profile-link').addEventListener('click', () => openDoctorProfile(doctor, appointments));
    div.querySelector('.danger').addEventListener('click', () => {
      if (!confirm('Tem a certeza que deseja excluir este médico?')) return;
      doctors.splice(index, 1);
      save(); renderDoctors(); toast('Médico excluído.');
    });
    $('doctorList').appendChild(div);
    const option = document.createElement('option');
    option.value = doctor.name; option.textContent = doctor.name;
    $('newDoctor').appendChild(option);
  });
}
$('addDoctor').addEventListener('click', () => {
  const name = $('doctorName').value.trim();
  if (!name) return toast('Preencha o nome do médico.');
  doctors.push({ name, specialty: $('doctorSpecialty').value.trim(), phone: $('doctorPhone').value.trim(), email: $('doctorEmail').value.trim() });
  save(); renderDoctors();
  clearFields(['doctorName', 'doctorSpecialty', 'doctorPhone', 'doctorEmail']);
  toast('Médico adicionado.');
});

function addOrUpdatePatient(name, phone, history) {
  name = name.trim(); phone = phone.trim();
  if (!name) return;
  const existing = patients.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    if (phone) existing.phone = phone;
    if (history) existing.history = history;
  } else patients.push({ name, phone, history });
  save(); renderPatients(); updateDashboard();
}
function filterPatients() {
  const query = $('patientSearch').value.toLowerCase();
  document.querySelectorAll('#patientList .patient').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? 'flex' : 'none';
  });
}
function renderPatients() {
  $('patientList').innerHTML = patients.length ? '' : '<div class="empty">Ainda não existem pacientes registados.</div>';
  patients.forEach((patient, index) => {
    const div = document.createElement('div');
    div.className = 'patient';
    div.innerHTML = `<button class="patient-info profile-link" aria-label="Ver perfil de ${escapeHtml(patient.name)}"><span class="avatar">${escapeHtml(patient.name.charAt(0).toUpperCase())}</span>
      <span><strong>${escapeHtml(patient.name)}</strong><span class="small" style="display:block">📞 ${escapeHtml(patient.phone || 'Sem telefone')}</span></span></button>
      <a class="btn secondary call-btn">Ligar</a><button class="btn danger">Excluir</button>`;
    if (patient.phone) div.querySelector('.call-btn').href = `tel:${patient.phone.replace(/\s/g, '')}`;
    div.querySelector('.call-btn').addEventListener('click', () => calls.makeCall(patient.name, patient.phone));
    div.querySelector('.profile-link').addEventListener('click', () => openPatientProfile(patient, appointments, walkins));
    div.querySelector('.danger').addEventListener('click', () => {
      if (!confirm('Tem a certeza que deseja excluir este paciente?')) return;
      patients.splice(index, 1);
      save(); renderPatients(); updateDashboard(); toast('Paciente excluído.');
    });
    $('patientList').appendChild(div);
  });
  filterPatients();
}
$('patientSearch').addEventListener('input', filterPatients);
for (const [nameId, historyForm] of [['newName', bookingHistory], ['walkName', walkinHistory]]) {
  $(nameId).addEventListener('change', () => {
    const patient = patients.find(p => p.name.toLowerCase() === $(nameId).value.trim().toLowerCase());
    historyForm.fill(patient?.history);
  });
}

$('book').addEventListener('click', () => {
  const name = $('newName').value.trim();
  const phone = $('newPhone').value.trim();
  const date = $('newDate').value;
  const time = $('newTime').value;
  if (!name) return toast('Preencha o nome do paciente.');
  if (!date) return toast('Selecione a data.');
  if (!time) return toast('Selecione a hora.');
  let history;
  try { history = bookingHistory.read(); } catch (error) { return toast(error.message); }
  appointments.push({ id: Date.now(), name, phone, date, time, type: $('newType').value || 'Consulta', doctor: $('newDoctor').value || '—', notes: $('newNotes').value.trim(), status: 'Agendada', history });
  addOrUpdatePatient(name, phone, history);
  save(); renderAppointments(); updateDashboard();
  clearFields(['newName', 'newPhone', 'newDate', 'newTime', 'newType', 'newDoctor', 'newNotes']);
  bookingHistory.fill(null);
  toast('Marcação criada com sucesso.'); showPage('dashboard');
});
function renderAppointments() {
  $('todayAppointments').innerHTML = appointments.length ? '' : emptyRow('Nenhuma consulta registada.', 7);
  appointments.sort((a, b) => (a.date + ' ' + a.time).localeCompare(b.date + ' ' + b.time)).forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(a.time)}</td><td><strong>${escapeHtml(a.name)}</strong></td><td>${escapeHtml(a.phone || '—')}</td>
      <td>${escapeHtml(a.type)}</td><td>${escapeHtml(a.doctor)}</td><td><span class="status">${escapeHtml(a.status)}</span></td>
      <td class="call-actions"><a class="btn secondary call-link">Ligar</a> <button class="btn danger">Excluir</button></td>`;
    if (a.phone) tr.querySelector('.call-link').href = `tel:${a.phone.replace(/\s/g, '')}`;
    tr.querySelector('.call-link').addEventListener('click', () => calls.makeCall(a.name, a.phone));
    tr.querySelector('.danger').addEventListener('click', () => {
      if (!confirm('Tem a certeza que deseja excluir esta marcação?')) return;
      appointments = appointments.filter(item => item.id !== a.id);
      save(); renderAppointments(); updateDashboard(); toast('Marcação excluída.');
    });
    $('todayAppointments').appendChild(tr);
  });
}

$('addWalkin').addEventListener('click', () => {
  const name = $('walkName').value.trim();
  if (!name) return toast('Preencha o nome do paciente.');
  let history;
  try { history = walkinHistory.read(); } catch (error) { return toast(error.message); }
  const walkin = { id: Date.now(), name, phone: $('walkPhone').value.trim(), time: $('walkTime').value || '—', date: $('walkDate').value || '—', reason: $('walkReason').value || '—', priority: $('walkPriority').value || 'Normal', status: $('walkStatus').value || 'A aguardar', notes: $('walkNotes').value.trim(), history };
  walkins.push(walkin); addOrUpdatePatient(name, walkin.phone, history);
  save(); renderWalkins(); updateDashboard();
  clearFields(['walkName', 'walkPhone', 'walkTime', 'walkDate', 'walkReason', 'walkPriority', 'walkStatus', 'walkNotes']);
  walkinHistory.fill(null);
  toast('Walk-in adicionado à lista.');
});
function renderWalkins() {
  $('walkinList').innerHTML = walkins.length ? '' : emptyRow('Nenhum walk-in registado.', 7);
  walkins.forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(w.time)}</td><td>${escapeHtml(w.name)}</td><td>${escapeHtml(w.phone || '—')}</td>
      <td>${escapeHtml(w.reason)}</td><td>${escapeHtml(w.priority)}</td><td>${escapeHtml(w.status)}</td>
      <td class="call-actions"><a class="btn secondary call-link">Ligar</a> <button class="btn danger">Excluir</button></td>`;
    if (w.phone) tr.querySelector('.call-link').href = `tel:${w.phone.replace(/\s/g, '')}`;
    tr.querySelector('.call-link').addEventListener('click', () => calls.makeCall(w.name, w.phone));
    tr.querySelector('.danger').addEventListener('click', () => {
      if (!confirm('Excluir este walk-in?')) return;
      walkins = walkins.filter(item => item.id !== w.id);
      save(); renderWalkins(); updateDashboard(); toast('Walk-in excluído.');
    });
    $('walkinList').appendChild(tr);
  });
}
function updateDashboard() {
  $('countAppointments').textContent = appointments.length;
  $('countWaiting').textContent = walkins.filter(w => w.status === 'A aguardar').length;
  $('countWalkins').textContent = walkins.length;
  $('countPatients').textContent = patients.length;
}
/* — Contacto da clínica (número para receber chamadas) — */
const clinicPhoneInput = $('clinicPhone');
const clinicCallBtn = $('clinicCallBtn');
clinicPhoneInput.value = localStorage.getItem('clinicPhone') || '';
clinicCallBtn.addEventListener('click', () => {
  const phone = clinicPhoneInput.value.trim();
  if (!phone) return toast('Introduza o número da clínica.');
  window.location.href = `tel:${phone.replace(/\s/g, '')}`;
});
clinicPhoneInput.addEventListener('change', () => {
  localStorage.setItem('clinicPhone', clinicPhoneInput.value.trim());
  toast('Número da clínica guardado.');
});

refreshAgenda = setupAgenda(() => appointments);
const calls = setupCalls(() => patients, () => doctors);
renderDoctors(); renderPatients(); renderAppointments(); renderWalkins(); updateDashboard();
