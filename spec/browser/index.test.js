// @flow
import Frecency from '../../src/browser';
import { LocalStorageMock } from './mocks';

describe('frecency', () => {
  beforeEach(() => {
    global.localStorage = new LocalStorageMock();
  });

  describe('#save', () => {
    it('should work.', () => {
      const frecency = new Frecency({ key: 'templates' });

      global.Date.now = jest.fn(() => 1524085045510);

      frecency.save({
        searchQuery: 'brad',
        selectedId: 'vogel'
      });

      expect(frecency._getFrecencyData()).toEqual({
        queries: {
          brad: [{
            id: 'vogel',
            timesSelected: 1,
            selectedAt: [1524085045510]
          }]
        },
        selections: {
          vogel: {
            timesSelected: 1,
            selectedAt: [1524085045510],
            queries: {
              brad: true
            }
          }
        },
        recentSelections: ['vogel']
      });
    });
  });
});
