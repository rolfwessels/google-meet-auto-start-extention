export function getMeetingId(text: string): string {
  let regexp: RegExp = /([a-z]+-[a-z]+-[a-z]+)/;
  if (regexp.test(text)) {
    return regexp.exec(text)[1];
  }
  return null;
}
