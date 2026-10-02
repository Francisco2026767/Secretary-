const MIN_DATE = '2026-10-02';
function parseDate(value) { return new Date(`${value}T12:00:00`); }
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function setupAgenda(getAppointments) {
  const start = document.getElementById('agendaStart');
  const previous = document.getElementById('previousWeek');
  function render() {
    const calendar = document.getElementById('calendar');
    calendar.replaceChildren();
    previous.disabled = start.value <= MIN_DATE;
    for (let index = 0; index < 7; index++) {
      const date = parseDate(start.value);
      date.setDate(date.getDate() + index);
      const day = document.createElement('div'); day.className = 'day';
      const title = document.createElement('strong');
      title.textContent = date.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit' });
      day.append(title);
      const visits = getAppointments().filter(a => a.date === formatDate(date)).sort((a, b) => a.time.localeCompare(b.time));
      if (!visits.length) {
        const empty = document.createElement('p'); empty.className = 'small'; empty.textContent = 'Sem consultas'; day.append(empty);
      }
      visits.forEach(visit => {
        const slot = document.createElement('div'); slot.className = 'slot';
        slot.textContent = `${visit.time} · ${visit.name} · ${visit.doctor}`;
        day.append(slot);
      });
      calendar.append(day);
    }
  }
  function move(days) {
    const date = parseDate(start.value); date.setDate(date.getDate() + days);
    start.value = formatDate(date) < MIN_DATE ? MIN_DATE : formatDate(date); render();
  }
  start.addEventListener('change', () => {
    if (!start.value || start.value < MIN_DATE) start.value = MIN_DATE;
    render();
  });
  previous.addEventListener('click', () => move(-7));
  document.getElementById('nextWeek').addEventListener('click', () => move(7));
  render(); return render;
}
