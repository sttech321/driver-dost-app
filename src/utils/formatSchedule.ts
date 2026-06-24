// Human-friendly label for a scheduled pickup time.
// null => immediate ("Pick Now").
export function formatSchedule(date: Date | null): string {
  if (!date) return 'Pick Now';

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  let day: string;
  if (date.toDateString() === today.toDateString()) day = 'Today';
  else if (date.toDateString() === tomorrow.toDateString()) day = 'Tomorrow';
  else day = date.toLocaleDateString([], { day: '2-digit', month: 'short' });

  return `${day}, ${time}`;
}

// Round up to the next 5-minute mark, at least `bufferMins` from now —
// a sensible default starting value for the picker.
export function defaultScheduleStart(bufferMins = 15): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + bufferMins);
  const rem = d.getMinutes() % 5;
  if (rem) d.setMinutes(d.getMinutes() + (5 - rem));
  d.setSeconds(0, 0);
  return d;
}
