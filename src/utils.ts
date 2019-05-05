export function getMeetingId(text: string): string {
  let regexp: RegExp = /([a-z]+-[a-z]+-[a-z]+)/;
  if (regexp.test(text)) {
    return regexp.exec(text)[1];
  }
  return null;
}

export function addMinutes(minutes: number, date: Date = null) {
  return new Date((date || new Date()).getTime() + minutes * 60000);
}

export function toUnixTime(date: Date = null): number {
  if (date == null) return Date.now();
  return date.getTime();
}

export class Settings<T> {
  store(value: T): Promise<T> {
    let promise = new Promise<T>(function(resolve, reject) {
      chrome.storage.local.set(value, () => {
        resolve(value);
      });
    });

    return promise;
  }

  get(defaultValue: T): Promise<T> {
    let promise = new Promise<T>(function(resolve, reject) {
      chrome.storage.local.get(defaultValue, function(items) {
        resolve(items as T);
      });
    });
    return promise;
  }
}
