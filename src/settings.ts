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
