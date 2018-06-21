// @flow
export class LocalStorageMock {
  data: { [string]: ?string };
  length: number;

  constructor() {
    this.data = {};
    this.length = Object.keys(this.data).length;
  }

  getItem(key: string) {
    const value = this.data[key];
    return (!value && typeof value !== 'string') ? null : value;
  }

  setItem(key: string, value: string) {
    this.data[key] = value;
  }

  removeItem(key: string) {
    delete this.data[key];
  }

  key(n: number) {
    const key = Object.keys(this.data)[n];
    const value = this.data[key];
    return (!value && typeof value !== 'string') ? null : value;
  }

  clear() {
    this.data = {};
  }
}
