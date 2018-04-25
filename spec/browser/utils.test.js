// @flow
import { isSubQuery } from '../../src/browser/utils';

describe('utils', () => {
  describe('isSubQuery', () => {
    it('should be case-insensitive.', () => {
      expect(isSubQuery('BRAD', 'bradford')).toBe(true);
    });

    it('should match full word.', () => {
      expect(isSubQuery('brad', 'brad')).toBe(true);
    });

    it('should match multiple words.', () => {
      expect(isSubQuery('t d', 'team design')).toBe(true);
      expect(isSubQuery('tea des', 'team design')).toBe(true);
      expect(isSubQuery('Team Design', 'team design')).toBe(true);
    });

    it('should match out of order', () => {
      expect(isSubQuery('Design', 'team design')).toBe(true);
      expect(isSubQuery('bee and bir', 'birds and bees')).toBe(true);
      expect(isSubQuery('for form fort', 'formula fortitude fortuitous')).toBe(true);
    });

    it('should ignore extra whitespace', () => {
      expect(isSubQuery('  team    design  ', 'design team')).toBe(true);
    });

    it('should not match if not a prefix', () => {
      expect(isSubQuery('vogel', 'brad')).toBe(false);
      expect(isSubQuery('rad', 'brad')).toBe(false);
    });

    it('should not match if search string is longer', () => {
      expect(isSubQuery('bradford', 'brad')).toBe(false);
    });

    it('should not match if one of the words in search string does not match', () => {
      expect(isSubQuery('tear design', 'design team')).toBe(false);
      expect(isSubQuery('design team team', 'design team')).toBe(false);
    });
  });
});
