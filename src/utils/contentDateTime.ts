interface ContentDateTimeFields {
  date: string;
  time: string;
}

const CONTENT_TIME_ZONE_OFFSET = "+08:00";

/** Return an ISO 8601 publication timestamp using the site's Shanghai authoring time. */
export function contentDateTimeIso({ date, time }: ContentDateTimeFields): string {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${date}T${normalizedTime}${CONTENT_TIME_ZONE_OFFSET}`;
}

export function contentDateTime(fields: ContentDateTimeFields): Date {
  return new Date(contentDateTimeIso(fields));
}

export function contentTimestamp(fields: ContentDateTimeFields): number {
  return contentDateTime(fields).getTime();
}

export function compareContentDateTimeDescending<
  T extends { id: string; data: ContentDateTimeFields },
>(a: T, b: T): number {
  const difference = contentTimestamp(b.data) - contentTimestamp(a.data);
  if (difference !== 0) return difference;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
