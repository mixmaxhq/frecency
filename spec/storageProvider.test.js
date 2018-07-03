// @flow
import Frecency from '../src';
import { LocalStorageMock } from './mocks';

describe('frecency', () => {
  beforeEach(() => {
    global.__SERVER__ = true;
    global.localStorage = new LocalStorageMock();
  });

  describe('#storageProvider', () => {
    it('should instantiate correctly with given storage provider', () => {
      const storageProvider = new LocalStorageMock();
      expect(() => new Frecency({ key: 'templates', storageProvider })).not.toThrow('Missing Storage Provider');
    });

    it('should throw error if the storage provider is missing from global', () => {
      global.localStorage = undefined;
      expect(() => new Frecency({ key: 'templates' })).toThrow('Missing Storage Provider');
    });
  });
});
