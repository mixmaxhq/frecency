// @flow
import type {
  FrecencyData,
  FrecencyOptions,
  ComputeScoreParams,
  SaveParams,
  SortParams,
  StorageProvider,
} from './types';
import { isSubQuery, loadStorageProvider } from './utils';

class Frecency {
  // Used to create key that will be used to save frecency data in localStorage.
  _key: string;
  // Max number of timestamps to save for recent selections of a result.
  _timestampsLimit: number;
  // Max number of IDs that should be stored in frecency to limit the object size.
  _recentSelectionsLimit: number;
  // Attribute to use as the search result's id.
  _idAttribute: string | Function;

  _localStorageEnabled: boolean;
  _storageProvider: ?StorageProvider;
  _frecency: FrecencyData;

  _exactQueryMatchWeight: number;
  _subQueryMatchWeight: number;
  _recentSelectionsMatchWeight: number;

  constructor({
    key,
    timestampsLimit,
    recentSelectionsLimit,
    idAttribute,
    storageProvider,
    exactQueryMatchWeight,
    subQueryMatchWeight,
    recentSelectionsMatchWeight,
  }: FrecencyOptions) {
    if (!key) throw new Error('key is required.');

    this._key = key;
    this._timestampsLimit = timestampsLimit || 10;
    this._recentSelectionsLimit = recentSelectionsLimit || 100;
    this._idAttribute = idAttribute || '_id';
    this._storageProvider = loadStorageProvider(storageProvider);
    this._localStorageEnabled = Boolean(this._storageProvider);
    this._exactQueryMatchWeight = exactQueryMatchWeight || 1.0;
    this._subQueryMatchWeight = subQueryMatchWeight || 0.7;
    this._recentSelectionsMatchWeight = recentSelectionsMatchWeight || 0.5;

    this._frecency = this._getFrecencyData();
  }

  /**
   * Updates frecency data after user selects a result.
   * @param {Object} params
   *   @prop {String} selectedId - String representing the ID of the search result selected.
   *   @prop {String} searchQuery - The search query the user entered.
   *   @prop {Date} [dateSelection] - The date on which item has been selected.
   */
  save({ searchQuery, selectedId, dateSelection }: SaveParams): void {
    if (!selectedId || !this._localStorageEnabled) return;

    const date = dateSelection ? dateSelection.getTime() : Date.now();

    // Reload frecency here to pick up frecency updates from other tabs.
    const frecency = this._getFrecencyData();

    // Associate the selection with the search query used. This lets us sort this
    // selection higher when the user enters the search query again. See:
    // https://slack.engineering/a-faster-smarter-quick-switcher-77cbc193cb60#80de
    this._updateFrecencyByQuery(frecency, searchQuery, selectedId, date);

    // Associate the selection with its ID. If the user doesn't enter the same search
    // query as before, but this selection shows up in the list of results, we still
    // want this selection to show up higher because it was recently selected. See:
    // https://slack.engineering/a-faster-smarter-quick-switcher-77cbc193cb60#700c
    this._updateFrecencyById(frecency, searchQuery, selectedId, date);

    this._cleanUpOldIds(frecency, selectedId);
    this._saveFrecencyData(frecency);

    this._frecency = frecency;
  }

  // Returns the key that will be used to save frecency data in storage.
  _getFrecencyKey(): string {
    return `frecency_${this._key}`;
  }

  // Reads frecency data from storage and returns the frecency object if
  // the stored frecency data is valid.
  _getFrecencyData(): FrecencyData {
    const defaultFrecency: FrecencyData = {
      queries: {},
      selections: {},
      recentSelections: [],
    };

    if (!this._localStorageEnabled || !this._storageProvider) return defaultFrecency;

    const savedData = this._storageProvider.getItem(this._getFrecencyKey());
    if (!savedData) return defaultFrecency;

    try {
      return JSON.parse(savedData);
    } catch (e) {
      return defaultFrecency;
    }
  }

  /**
   * Save frecency data back to storage.
   * @param {FrecencyData} frecency
   */
  _saveFrecencyData(frecency: FrecencyData): void {
    if (!this._localStorageEnabled || !this._storageProvider) return;

    this._storageProvider.setItem(this._getFrecencyKey(), JSON.stringify(frecency));
  }

  /**
   * Updates frecency by the search query the user entered when selecting a result.
   * @param {FrecencyData} frecency - Frecency object to be modified in place.
   * @param {String} searchQuery - Search query the user entered.
   * @param {String} selectedId - ID of search result the user selected.
   * @param {Number} timestampSelection - Time in milliseconds.
   */
  _updateFrecencyByQuery(
    frecency: FrecencyData,
    searchQuery: ?string,
    selectedId: string,
    timestampSelection: number,
  ): void {
    if (!searchQuery) return;

    const queries = frecency.queries;
    if (!queries[searchQuery]) queries[searchQuery] = [];

    const previousSelection = queries[searchQuery].find((selection) => {
      return selection.id === selectedId;
    });

    // If this ID was not selected previously for this search query, we'll
    // create a new entry.
    if (!previousSelection) {
      queries[searchQuery].push({
        id: selectedId,
        timesSelected: 1,
        selectedAt: [timestampSelection],
      });
      return;
    }

    // Otherwise, increment the previous entry.
    previousSelection.timesSelected += 1;
    previousSelection.selectedAt.push(timestampSelection);

    // Limit the selections timestamps.
    if (previousSelection.selectedAt.length > this._timestampsLimit) {
      previousSelection.selectedAt.shift();
    }
  }

  /**
   * Updates frecency by the ID of the result selected.
   * @param {FrecencyData} frecency - Frecency object to be modified in place.
   * @param {String} searchQuery - Search query the user entered.
   * @param {String} selectedId - ID of search result the user selected.
   * @param {Number} timestampSelection - Time in milliseconds.
   */
  _updateFrecencyById(
    frecency: FrecencyData,
    searchQuery: ?string,
    selectedId: string,
    timestampSelection: number,
  ): void {
    const selections = frecency.selections;
    const previousSelection = selections[selectedId];

    // If this ID was not selected previously, we'll create a new entry.
    if (!previousSelection) {
      selections[selectedId] = {
        timesSelected: 1,
        selectedAt: [timestampSelection],
        queries: {},
      };

      if (searchQuery) selections[selectedId].queries[searchQuery] = true;
      return;
    }

    // Otherwise, update the previous entry.
    previousSelection.timesSelected += 1;
    previousSelection.selectedAt.push(timestampSelection);

    // Limit the selections timestamps.
    if (previousSelection.selectedAt.length > this._timestampsLimit) {
      previousSelection.selectedAt.shift();
    }

    // Remember which search queries this result was selected for so we can
    // remove this result from frecency later when cleaning up.
    if (searchQuery) previousSelection.queries[searchQuery] = true;
  }

  /**
   * Remove the oldest IDs in the frecency data once the number of IDs
   * saved in frecency has exceeded the limit.
   * @param {FrecencyData} frecency - Frecency object to be modified in place.
   * @param {String} selectedId - ID of search result the user selected.
   */
  _cleanUpOldIds(frecency: FrecencyData, selectedId: string): void {
    const recentSelections = frecency.recentSelections;

    // If frecency already contains the selected ID, shift it to the front.
    if (recentSelections.includes(selectedId)) {
      frecency.recentSelections = [selectedId, ...recentSelections.filter((id) => id !== selectedId)];
      return;
    }

    // Otherwise add the selected ID to the front of the list.
    if (recentSelections.length < this._recentSelectionsLimit) {
      frecency.recentSelections = [selectedId, ...recentSelections];
      return;
    }

    // If the number of recent selections has gone over the limit, we'll remove
    // the least recently used ID from the frecency data.
    const idToRemove = recentSelections.pop();

    frecency.recentSelections = [selectedId, ...recentSelections];

    const selectionById = frecency.selections[idToRemove];
    if (!selectionById) return;
    delete frecency.selections[idToRemove];

    Object.keys(selectionById.queries).forEach((query) => {
      frecency.queries[query] = frecency.queries[query].filter((selection) => {
        return selection.id !== idToRemove;
      });

      if (frecency.queries[query].length === 0) {
        delete frecency.queries[query];
      }
    });
  }

  /**
   * Calculates frecency score for given search result.
   *
   * @param {object[]} item - search result to calculate score for
   * @param {string} searchQuery - Search query the user entered
   * @param {number} now - the current Date.now()
   * @return {number} computed frecency score
   */
  computeScore({ searchQuery, item, now }: ComputeScoreParams): number {
    now = now || Date.now();
    const result = item;
    const resultId = this._getId(result);

    // Try calculating frecency score by exact query match.
    const frecencyForQuery = searchQuery && this._frecency.queries[searchQuery];

    if (frecencyForQuery) {
      const selection = frecencyForQuery.find((selection) => {
        return selection.id === resultId;
      });

      if (selection) {
        const frecencyScore =
          this._exactQueryMatchWeight * this._calculateScore(selection.selectedAt, selection.timesSelected, now);
        if (frecencyScore > 0) return frecencyScore;
      }
    }

    // Try calculating frecency score by sub-query match.
    const subQueries = Object.keys(this._frecency.queries).filter((query) => {
      return isSubQuery(searchQuery, query);
    });

    // Use for-loop to allow early-return.
    for (const subQuery of subQueries) {
      const selection = this._frecency.queries[subQuery].find((selection) => {
        return selection.id === resultId;
      });

      if (selection) {
        // Reduce the score because this is not an exact query match.
        const frecencyScore =
          this._subQueryMatchWeight * this._calculateScore(selection.selectedAt, selection.timesSelected, now);
        if (frecencyScore > 0) return frecencyScore;
      }
    }

    // Try calculating frecency score by ID.
    const selection = this._frecency.selections[resultId];
    if (selection) {
      // Reduce the score because this is not an exact query match.
      return (
        this._recentSelectionsMatchWeight * this._calculateScore(selection.selectedAt, selection.timesSelected, now)
      );
    }
    return 0;
  }

  /**
   * Sorts a list of search results based on the saved frecency data.
   * @param {Object} params
   *   @prop {String} searchQuery - The search query the user entered.
   *   @prop {Object[]} results - The list of search results to sort.
   *   @prop {boolean} keepScores - Keep the frecency score attached to each item.
   * @return {Object[]} Search results sorted by frecency.
   */
  sort({ searchQuery, results, keepScores = false }: SortParams): Object[] {
    if (!this._localStorageEnabled) return results;

    const now = Date.now();
    results.forEach((item) => {
      item._frecencyScore = this.computeScore({ searchQuery, item, now });
    });

    // For recent selections, sort by frecency. Otherwise, fall back to
    // server-side sorting.
    const recentSelections = results.filter((result) => result._frecencyScore > 0);
    const otherSelections = results.filter((result) => result._frecencyScore === 0);

    const sortedResults = [...recentSelections.sort((a, b) => b._frecencyScore - a._frecencyScore), ...otherSelections];

    if (keepScores) return sortedResults;

    return sortedResults.map((result) => {
      delete result._frecencyScore;
      return result;
    });
  }

  /**
   * Returns the ID of a search result that will be used for sorting.
   * @param {Object} result - Search result to retrieve the ID from.
   * @return {String} The ID of the search result.
   */
  _getId(result: Object): string {
    if (typeof this._idAttribute === 'function') {
      return this._idAttribute(result);
    } else {
      return result[this._idAttribute];
    }
  }

  /**
   * Calculates a frecency score based on the timestamps a resources was selected,
   * the total number of times selected, and the current time.
   * @param {Number[]} timestamps - Timestamps of recent selections.
   * @param {Number} timesSelected - Total number of times selected.
   * @param {Number} timestampSelection - Time in milliseconds.
   * @return {Number} The calculated frecency score.
   */
  _calculateScore(timestamps: number[], timesSelected: number, timestampSelection: number): number {
    if (timestamps.length === 0) return 0;

    const hour = 1000 * 60 * 60;
    const day = 24 * hour;

    const totalScore = timestamps.reduce((score, timestamp) => {
      if (timestamp >= timestampSelection - 3 * hour) return score + 100;
      if (timestamp >= timestampSelection - day) return score + 80;
      if (timestamp >= timestampSelection - 3 * day) return score + 60;
      if (timestamp >= timestampSelection - 7 * day) return score + 30;
      if (timestamp >= timestampSelection - 14 * day) return score + 10;
      return score;
    }, 0);

    return timesSelected * (totalScore / timestamps.length);
  }
}

export default Frecency;
