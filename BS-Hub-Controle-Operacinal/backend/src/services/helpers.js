function pad(n) { return String(n).padStart(2, '0'); }
function toMinutes(h) { const [hh, mm] = String(h).slice(0,5).split(':').map(Number); return hh * 60 + mm; }
function toTime(n) { return `${pad(Math.floor(n/60))}:${pad(n%60)}`; }
function localDateText(date = new Date()) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`; }
function dateTime(data, hora) { return `${data}T${hora}:00`; }
function dayOfWeek(dateString) { return new Date(`${dateString}T12:00:00`).getDay(); }
function hoursUntil(iso) { return (new Date(iso).getTime() - Date.now()) / 3600000; }
function conflict(aStart, aDuration, bStart, bDuration) {
  const a = toMinutes(aStart), b = toMinutes(bStart);
  return a < b + Number(bDuration) && a + Number(aDuration) > b;
}
module.exports = { toMinutes, toTime, localDateText, dateTime, dayOfWeek, hoursUntil, conflict };
