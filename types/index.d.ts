// Type definitions for @getstation/frecency 1.4
// Project: https://github.com/getstation/frecency

// TypeScript Version: 3.9

declare module "@getstation/frecency" {
  export type idAttrFn = (result: string) => string;

  export type StorageProvider = {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };

  export default class Frecency<T = any> {
    constructor(constructOpts: {
      key: string;
      idAttribute?: string | idAttrFn;
      timeStampsLimit?: number;
      recentSelectionsLimit?: number;
      storageProvider?: StorageProvider;
      exactQueryMatchWeight?: number;
      subQueryMatchWeight?: number;
      recentSelectionsMatchWeight?: number;
    });
    save: (arg: {
      searchQuery: string;
      selectedId: string;
      dateSelection?: Date;
    }) => void;
    sort:
      | ((arg: { searchQuery: string; results: T[] }) => T[])
      | ((arg: {
          searchQuery: string;
          results: T[];
          keepScores?: boolean;
        }) => Array<T & { _frecencyScore?: number }>);
  }
}
