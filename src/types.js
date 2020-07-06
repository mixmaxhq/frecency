// @flow
export type FrecencyData = {
  // Stores information about which results the user selected based on
  // their search query and how frequently they selected these results.
  queries: {
    [searchQuery: string]: Array<{
      id: string,

      // Total number of times this result was selected.
      timesSelected: number,

      // The list of timestamps of the most recent selections, which will
      // be used to calculate relevance scores for each result.
      selectedAt: number[],
    }>,
  },

  // Stores information about how often a particular result has been chosen
  // based on its id. Use case:
  // 1. User searches "brad" and selects "brad vogel" very often.
  // 2. User searches "vogel" and "brad vogel" appears in the list of search results.
  // 3. Even though the user has never searched "vogel", we still want "brad vogel"
  //    to rank higher because "brad vogel" has been selected very often.
  selections: {
    [id: string]: {
      // Total times this result was chosen regardless of the user's search query.
      timesSelected: number,

      // The list of timestamps of the most recent selections, which will
      // be used to calculate relevance scores for each result.
      selectedAt: number[],

      // The set of queries where the user selected this result. Used when removing results
      // from the frecency data in order to limit the size of the frecency object.
      queries: { [query: string]: true },
    },
  },

  // Cache of recently selected IDs (ordered from most to least recent). When an ID is
  // selected we'll add or shift the ID to the front. When this list exceeds a certain
  // limit, we'll remove the last ID and remove all frecency data for this ID.
  recentSelections: string[],
};

export type StorageProvider = any &
  $ReadOnly<{
    getItem: (key: string) => ?string,
    setItem: (key: string, value: string) => void,
    removeItem: (key: string) => void,
    key: (n: number) => ?string,
    clear: () => void,
    length: number,
  }>;

export type FrecencyOptions = {
  key: string,
  timestampsLimit?: number,
  recentSelectionsLimit?: number,
  idAttribute?: string | Function,
  storageProvider?: StorageProvider,
  exactQueryMatchWeight?: number,
  subQueryMatchWeight?: number,
  recentSelectionsMatchWeight?: number,
};

export type SaveParams = {
  selectedId: string,
  searchQuery: ?string,
  dateSelection?: Date,
};

export type ComputeScoreParams = {
  searchQuery: ?string,
  item: Object,
  now?: number,
};

export type SortParams = {
  searchQuery: ?string,
  results: Object[],
  keepScores?: boolean,
};
