/** Parse a bounded, explicitly zoned instant or calendar date without local timezone inference. */
export function temporalMilliseconds(
  value: string,
  kind: 'date' | 'instant',
): number | undefined {
  const match =
    kind === 'date'
      ? /^([1-9]\d{3})-(\d{2})-(\d{2})$/.exec(value)
      : /^([1-9]\d{3})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(
          value,
        );
  if (!match) return undefined;
  const year = Number(match[1]),
    month = Number(match[2]),
    day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return undefined;
  if (kind === 'date') return date.getTime();
  const hours = Number(match[4]),
    minutes = Number(match[5]),
    seconds = Number(match[6]);
  if (hours > 23 || minutes > 59 || seconds > 59) return undefined;
  const fraction = Number((match[7] ?? '').padEnd(3, '0'));
  const zone = match[8]!;
  let offset = 0;
  if (zone === '-00:00') return undefined;
  if (zone !== 'Z') {
    const oh = Number(zone.slice(1, 3)),
      om = Number(zone.slice(4, 6));
    if (oh > 14 || om > 59 || (oh === 14 && om !== 0)) return undefined;
    offset = (oh * 60 + om) * (zone[0] === '+' ? 1 : -1);
  }
  return (
    Date.UTC(year, month - 1, day, hours, minutes, seconds, fraction) -
    offset * 60_000
  );
}
