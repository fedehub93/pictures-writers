export const ROME_TIME_ZONE = "Europe/Rome";

const ROME_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: ROME_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const ROME_ZONE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: ROME_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const getRomeDate = (date: Date): string | null => {
  const values = Object.fromEntries(
    ROME_DATE_FORMAT.formatToParts(date).map((part) => [part.type, part.value]),
  );

  const romeDate = `${values.year}-${values.month}-${values.day}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(romeDate) ? romeDate : null;
};

export const getRomeZoneOffset = (dateISO: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    return null;
  }

  const date = new Date(`${dateISO}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const values = Object.fromEntries(
    ROME_ZONE_FORMAT.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const asUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  const offsetMinutes = (asUTC - date.getTime()) / 60000;
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);

  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(
    abs % 60,
  ).padStart(2, "0")}`;
};

export const toRomeIso = (dateInput: string, time: string): string | null => {
  if (!/^\d{1,2}:\d{2}$/.test(time)) {
    return null;
  }

  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const romeDate = getRomeDate(parsed);
  if (!romeDate) {
    return null;
  }

  const offset = getRomeZoneOffset(romeDate);
  if (!offset) {
    return null;
  }

  const [hour, minute] = time.split(":");
  return `${romeDate}T${hour.padStart(2, "0")}:${minute}${offset}`;
};