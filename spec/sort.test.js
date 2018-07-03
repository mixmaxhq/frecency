// @flow
import Frecency from '../src';
import { LocalStorageMock } from './mocks';

const hour = 1000 * 60 * 60;
const day = 24 * hour;

describe('frecency', () => {
  beforeEach(() => {
    global.__SERVER__ = false;
    global.localStorage = new LocalStorageMock();
  });

  describe('#sort', () => {
    it('should not throw if localStorage is disabled.', () => {
      global.localStorage = undefined;
      const frecency = new Frecency({ key: 'templates' });

      expect(frecency.sort({
        searchQuery: 'brad',
        results: [{
          _id: 'brad vogel'
        }, {
          _id: 'simon xiong'
        }]
      })).toEqual([{
        _id: 'brad vogel'
      }, {
        _id: 'simon xiong'
      }]);
    });

    it('should not sort if frecency is empty.', () => {
      const frecency = new Frecency({ key: 'templates' });

      const results = frecency.sort({
        searchQuery: 'brad',
        results: [{
          _id: 'brad vogel'
        }, {
          _id: 'simon xiong'
        }, {
          _id: 'brad neuberg'
        }]
      });

      expect(results).toEqual([{
        _id: 'brad vogel'
      }, {
        _id: 'simon xiong'
      }, {
        _id: 'brad neuberg'
      }]);
    });

    it('should sort if search query is empty.', () => {
      const frecency = new Frecency({ key: 'templates' });
      const now = 1524085045510;

      global.Date.now = jest.fn(() => now - 1 * hour);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad neuberg'
      });

      global.Date.now = jest.fn(() => now);

      const results = frecency.sort({
        searchQuery: '',
        results: [{
          _id: 'brad vogel'
        }, {
          _id: 'simon xiong'
        }, {
          _id: 'brad neuberg'
        }]
      });

      expect(results).toEqual([{
        _id: 'brad neuberg'
      }, {
        _id: 'brad vogel'
      }, {
        _id: 'simon xiong'
      }]);
    });

    it('should sort higher if search query was recently selected.', () => {
      const frecency = new Frecency({ key: 'templates' });
      const now = 1524085045510;

      global.Date.now = jest.fn(() => now - 1 * hour);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad neuberg'
      });

      global.Date.now = jest.fn(() => now);

      const results = frecency.sort({
        searchQuery: 'brad',
        results: [{
          _id: 'brad vogel'
        }, {
          _id: 'simon xiong'
        }, {
          _id: 'brad neuberg'
        }]
      });

      expect(results).toEqual([{
        _id: 'brad neuberg'
      }, {
        _id: 'brad vogel'
      }, {
        _id: 'simon xiong'
      }]);
    });

    it('should sort higher if search query is a subquery of recent selected query.', () => {
      const frecency = new Frecency({ key: 'templates' });
      const now = 1524085045510;

      global.Date.now = jest.fn(() => now - 1 * hour);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad neuberg'
      });

      global.Date.now = jest.fn(() => now);

      const results = frecency.sort({
        searchQuery: 'br',
        results: [{
          _id: 'brad vogel'
        }, {
          _id: 'simon xiong'
        }, {
          _id: 'brad neuberg'
        }]
      });

      expect(results).toEqual([{
        _id: 'brad neuberg'
      }, {
        _id: 'brad vogel'
      }, {
        _id: 'simon xiong'
      }]);
    });

    it('should sort higher if an ID was recently selected.', () => {
      const frecency = new Frecency({ key: 'templates' });
      const now = 1524085045510;

      global.Date.now = jest.fn(() => now - 1 * hour);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad neuberg'
      });

      global.Date.now = jest.fn(() => now);

      const results = frecency.sort({
        searchQuery: 'neuberg',
        results: [{
          _id: 'brad vogel'
        }, {
          _id: 'simon xiong'
        }, {
          _id: 'brad neuberg'
        }]
      });

      expect(results).toEqual([{
        _id: 'brad neuberg'
      }, {
        _id: 'brad vogel'
      }, {
        _id: 'simon xiong'
      }]);
    });

    it('should sort higher if selections are more recent.', () => {
      const frecency = new Frecency({ key: 'templates' });
      const now = 1524085045510;

      // We select brad vogel 3 times, but many days earlier.
      for (let i = 0; i < 3; ++i) {
        global.Date.now = jest.fn(() => now - 7 * day);
        frecency.save({
          searchQuery: 'brad',
          selectedId: 'brad vogel'
        });
      }

      // We select brad neuberg 2 times, but within the last hour.
      for (let i= 0; i < 2; ++i) {
        global.Date.now = jest.fn(() => now - 1 * hour);
        frecency.save({
          searchQuery: 'brad',
          selectedId: 'brad neuberg'
        });
      }

      global.Date.now = jest.fn(() => now);

      const results = frecency.sort({
        searchQuery: 'brad',
        results: [{
          _id: 'brad vogel'
        }, {
          _id: 'simon xiong'
        }, {
          _id: 'brad neuberg'
        }]
      });

      expect(results).toEqual([{
        _id: 'brad neuberg'
      }, {
        _id: 'brad vogel'
      }, {
        _id: 'simon xiong'
      }]);
    });

    it('should give non-exact matches a reduced score.', () => {
      const frecency = new Frecency({ key: 'templates' });
      const now = 1524085045510;

      // We'll use this as an exact match.
      global.Date.now = jest.fn(() => now - 1 * hour);
      frecency.save({
        searchQuery: 'br',
        selectedId: 'simon xiong'
      });

      // We'll use this as a sub-query match.
      global.Date.now = jest.fn(() => now - 1 * hour);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad neuberg'
      });

      // We'll use this as an ID match.
      global.Date.now = jest.fn(() => now - 1 * hour);
      frecency.save({
        searchQuery: 'vogel',
        selectedId: 'brad vogel'
      });

      global.Date.now = jest.fn(() => now);

      const results = frecency.sort({
        searchQuery: 'br',
        results: [{
          _id: 'brad vogel'
        }, {
          _id: 'simon xiong'
        }, {
          _id: 'brad neuberg'
        }, {
          _id: 'other'
        }]
      });

      expect(results).toEqual([{
        _id: 'simon xiong'
      }, {
        _id: 'brad neuberg'
      }, {
        _id: 'brad vogel'
      }, {
        _id: 'other'
      }]);
    });

    it('supports different ID attribute.', () => {
      const frecency = new Frecency({
        key: 'templates',
        idAttribute: 'email'
      });

      const now = 1524085045510;

      global.Date.now = jest.fn(() => now - 1 * hour);
      frecency.save({
        searchQuery: 'sim',
        selectedId: 'simon@mixmax.com'
      });

      global.Date.now = jest.fn(() => now);

      const results = frecency.sort({
        searchQuery: 'br',
        results: [{
          _id: 'simon@mixmax.com',
          email: 'other@mixmax.com'
        }, {
          _id: 'not simon',
          email: 'simon@mixmax.com'
        }]
      });

      expect(results).toEqual([{
        _id: 'not simon',
        email: 'simon@mixmax.com'
      }, {
        _id: 'simon@mixmax.com',
        email: 'other@mixmax.com'
      }]);
    });

    it('supports unified search using ID attribute function.', () => {
      const frecency = new Frecency({
        key: 'templates',
        idAttribute: (result) => {
          // Results are a mix of email contacts or contact groups.
          return result.email || result.groupName;
        }
      });

      const now = 1524085045510;

      global.Date.now = jest.fn(() => now - 1 * day);
      frecency.save({
        searchQuery: 'sim',
        selectedId: 'simon@mixmax.com'
      });

      global.Date.now = jest.fn(() => now - 1 * hour);
      frecency.save({
        searchQuery: 'personal',
        selectedId: 'personal contact group'
      });

      global.Date.now = jest.fn(() => now);

      const results = frecency.sort({
        searchQuery: 'per',
        results: [{
          email: 'brad@mixmax.com'
        }, {
          groupName: 'everyone'
        }, {
          email: 'simon@mixmax.com'
        }, {
          groupName: 'personal contact group'
        }, {
          groupName: 'testing group'
        }]
      });

      expect(results).toEqual([{
        groupName: 'personal contact group'
      }, {
        email: 'simon@mixmax.com'
      }, {
        email: 'brad@mixmax.com'
      }, {
        groupName: 'everyone'
      }, {
        groupName: 'testing group'
      }]);
    });
  });
});
