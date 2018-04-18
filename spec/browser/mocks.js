export class LocalStorageMock {
  data: { [string]: ?string };

  constructor() {
    this.data = {};
  }

  getItem(key: string) {
    const value = this.data[key];
    return (!value && typeof value !== 'string') ? null : value;
  }

  setItem(key: string, value: string) {
    this.data[key] = value;
  }
}
