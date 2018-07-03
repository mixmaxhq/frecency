// @flow
import Frecency from '../src';
import { LocalStorageMock } from './mocks';

describe('frecency', () => {
  beforeEach(() => {
    global.__SERVER__ = false;
    global.localStorage = new LocalStorageMock();
  });

  describe('#save', () => {
    it('should not throw if localStorage is disabled.', () => {
      global.localStorage = undefined;
      const frecency = new Frecency({ key: 'templates' });

      expect(frecency.save({
        searchQuery: 'search',
        selectedId: 'test'
      })).toBeUndefined();
    });

    it('stores multiple queries.', () => {
      const frecency = new Frecency({ key: 'templates' });

      global.Date.now = jest.fn(() => 1524085045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad vogel'
      });

      global.Date.now = jest.fn(() => 1524270045510);
      frecency.save({
        searchQuery: 'simon xi',
        selectedId: 'simon xiong'
      });

      const data = JSON.parse((localStorage.getItem('frecency_templates'): any));
      expect(data).toEqual({
        queries: {
          brad: [{
            id: 'brad vogel',
            timesSelected: 1,
            selectedAt: [1524085045510]
          }],
          'simon xi': [{
            id: 'simon xiong',
            timesSelected: 1,
            selectedAt: [1524270045510]
          }],
        },
        selections: {
          'brad vogel': {
            timesSelected: 1,
            selectedAt: [1524085045510],
            queries: { brad: true }
          },
          'simon xiong': {
            timesSelected: 1,
            selectedAt: [1524270045510],
            queries: { 'simon xi': true }
          }
        },
        recentSelections: ['simon xiong', 'brad vogel', ]
      });
    });

    it('stores different selections for the same query.', () => {
      const frecency = new Frecency({ key: 'templates' });

      global.Date.now = jest.fn(() => 1524085045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad vogel'
      });

      global.Date.now = jest.fn(() => 1524270045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad neuberg'
      });

      const data = JSON.parse((localStorage.getItem('frecency_templates'): any));
      expect(data).toEqual({
        queries: {
          brad: [{
            id: 'brad vogel',
            timesSelected: 1,
            selectedAt: [1524085045510]
          }, {
            id: 'brad neuberg',
            timesSelected: 1,
            selectedAt: [1524270045510]
          }],
        },
        selections: {
          'brad vogel': {
            timesSelected: 1,
            selectedAt: [1524085045510],
            queries: { brad: true }
          },
          'brad neuberg': {
            timesSelected: 1,
            selectedAt: [1524270045510],
            queries: { brad: true }
          },
        },

        recentSelections: ['brad neuberg', 'brad vogel']
      });
    });

    it('stores selections multiple times.', () => {
      const frecency = new Frecency({ key: 'templates' });

      global.Date.now = jest.fn(() => 1524085045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad vogel'
      });

      global.Date.now = jest.fn(() => 1524270045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad vogel'
      });

      global.Date.now = jest.fn(() => 1524351045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad vogel'
      });

      const data = JSON.parse((localStorage.getItem('frecency_templates'): any));
      expect(data).toEqual({
        queries: {
          brad: [{
            id: 'brad vogel',
            timesSelected: 3,
            selectedAt: [1524085045510, 1524270045510, 1524351045510]
          }]
        },
        selections: {
          'brad vogel': {
            timesSelected: 3,
            selectedAt: [1524085045510, 1524270045510, 1524351045510],
            queries: { brad: true }
          },
        },
        recentSelections: ['brad vogel']
      });
    });

    it('stores same selections with different queries.', () => {
      const frecency = new Frecency({ key: 'templates' });

      global.Date.now = jest.fn(() => 1524085045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad vogel'
      });

      global.Date.now = jest.fn(() => 1524301045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad vogel'
      });

      global.Date.now = jest.fn(() => 1524346045510);
      frecency.save({
        searchQuery: 'vogel',
        selectedId: 'brad vogel'
      });

      const data = JSON.parse((localStorage.getItem('frecency_templates'): any));
      expect(data).toEqual({
        queries: {
          brad: [{
            id: 'brad vogel',
            timesSelected: 2,
            selectedAt: [1524085045510, 1524301045510]
          }],
          vogel: [{
            id: 'brad vogel',
            timesSelected: 1,
            selectedAt: [1524346045510]
          }]
        },
        selections: {
          'brad vogel': {
            timesSelected: 3,
            selectedAt: [1524085045510, 1524301045510, 1524346045510],
            queries: { brad: true, vogel: true }
          }
        },
        recentSelections: ['brad vogel']
      });
    });

    it('limits number of timestamps per query.', () => {
      const frecency = new Frecency({
        key: 'templates',
        timestampsLimit: 3
      });

      [1524085000000, 1524086000000, 1524087000000, 1524088000000].forEach((time) => {
        global.Date.now = jest.fn(() => time);
        frecency.save({
          searchQuery: 'brad',
          selectedId: 'brad vogel'
        });
      });

      const data = JSON.parse((localStorage.getItem('frecency_templates'): any));
      expect(data).toEqual({
        queries: {
          brad: [{
            id: 'brad vogel',
            timesSelected: 4,
            selectedAt: [1524086000000, 1524087000000, 1524088000000]
          }]
        },
        selections: {
          'brad vogel': {
            timesSelected: 4,
            selectedAt: [1524086000000, 1524087000000, 1524088000000],
            queries: { brad: true }
          }
        },
        recentSelections: ['brad vogel']
      });
    });

    it('limits number of timestamps per selection.', () => {
      const frecency = new Frecency({
        key: 'templates',
        timestampsLimit: 3
      });

      [1524085000000, 1524086000000, 1524087000000, 1524088000000].forEach((time, index) => {
        global.Date.now = jest.fn(() => time);
        frecency.save({
          searchQuery: index % 2 === 0 ? 'brad' : 'vogel',
          selectedId: 'brad vogel'
        });
      });

      const data = JSON.parse((localStorage.getItem('frecency_templates'): any));
      expect(data).toEqual({
        queries: {
          brad: [{
            id: 'brad vogel',
            timesSelected: 2,
            selectedAt: [1524085000000, 1524087000000]
          }],
          vogel: [{
            id: 'brad vogel',
            timesSelected: 2,
            selectedAt: [1524086000000, 1524088000000]
          }]
        },
        selections: {
          'brad vogel': {
            timesSelected: 4,
            selectedAt: [1524086000000, 1524087000000, 1524088000000],
            queries: { brad: true, vogel: true }
          }
        },
        recentSelections: ['brad vogel']
      });
    });

    it('limits number of IDs saved in frecency.', () => {
      const frecency = new Frecency({
        key: 'templates',
        recentSelectionsLimit: 2
      });

      global.Date.now = jest.fn(() => 1524085045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad vogel'
      });

      global.Date.now = jest.fn(() => 1524270045510);
      frecency.save({
        searchQuery: 'brad',
        selectedId: 'brad neuberg'
      });

      global.Date.now = jest.fn(() => 1524360045510);
      frecency.save({
        searchQuery: 'simon xi',
        selectedId: 'simon xiong'
      });

      global.Date.now = jest.fn(() => 1524490045510);
      frecency.save({
        searchQuery: 'simon',
        selectedId: 'simon xiong'
      });

      const data = JSON.parse((localStorage.getItem('frecency_templates'): any));
      expect(data).toEqual({
        queries: {
          brad: [{
            id: 'brad neuberg',
            timesSelected: 1,
            selectedAt: [1524270045510]
          }],
          'simon xi': [{
            id: 'simon xiong',
            timesSelected: 1,
            selectedAt: [1524360045510]
          }],
          simon: [{
            id: 'simon xiong',
            timesSelected: 1,
            selectedAt: [1524490045510]
          }]
        },
        selections: {
          'brad neuberg': {
            timesSelected: 1,
            selectedAt: [1524270045510],
            queries: { brad: true }
          },
          'simon xiong': {
            timesSelected: 2,
            selectedAt: [1524360045510, 1524490045510],
            queries: { 'simon xi': true, simon: true }
          }
        },
        recentSelections: ['simon xiong', 'brad neuberg']
      });
    });
  });
});
