// @flow

import _ from 'underscore';
import type {FrecencyData, FrecencyOptions, SaveOptions} from './types';

class Frecency {
  // Used to create key that will be used to save frecency data in localStorage.
  _resourceType: string;
  // Max number of timestamps to save for recent selections of a result.
  _timestampsLimit: number;
  // Max number of IDs that should be stored in frecency to limit the object size.
  _recentSelectionsLimit: number;

  constructor({ resourceType, timestampsLimit, recentSelectionsLimit }: FrecencyOptions) {
    if (!resourceType) throw new Error('Resource type is required.');

    this._resourceType = resourceType;
    this._timestampsLimit = timestampsLimit || 10;
    this._recentSelectionsLimit = recentSelectionsLimit || 100;
  }

  save({ searchQuery, selectedId }: SaveOptions): void {
    if (!searchQuery || !selectedId) return;

    const now = Date.now();
    const frecency = this._getFrecencyData();

    this._updateFrecencyByQuery(frecency, searchQuery, selectedId, now);
    this._updateFrecencyById(frecency, searchQuery, selectedId, now);

    this._cleanUpOldSelections(frecency, selectedId);
    this._saveFrecencyData(frecency);
  }

  _getFrecencyKey(): string {
    return `frecency_${this._resourceType}`;
  }

  _getFrecencyData(): FrecencyData {
    const defaultFrecency = {
      queries: {},
      selections: {},
      recentSelections: []
    };

    const savedData = localStorage.getItem(this._getFrecencyKey());
    return savedData ? JSON.parse(savedData) : defaultFrecency;
  }

  _saveFrecencyData(frecency: FrecencyData): void {
    localStorage.setItem(this._getFrecencyKey(), JSON.stringify(frecency));
  }

  _updateFrecencyByQuery(frecency: FrecencyData, searchQuery: string, selectedId: string,
    now: number): void {

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
        selectedAt: [now]
      });
      return;
    }

    // Otherwise, increment the previous entry.
    previousSelection.timesSelected += 1;
    previousSelection.selectedAt.push(now);

    // Limit the recent selections timestamps.
    previousSelection.selectedAt = _.last(
      previousSelection.selectedAt,
      this._timestampsLimit
    );
  }

  _updateFrecencyById(frecency: FrecencyData, searchQuery: string, selectedId: string,
    now: number): void {

    const selections = frecency.selections;
    const previousSelection = selections[selectedId];

    // If this ID was not selected previously, we'll create a new entry.
    if (!previousSelection) {
      selections[selectedId] = {
        timesSelected: 1,
        selectedAt: [now],
        queries: { [searchQuery]: true }
      };
      return;
    }

    // Otherwise, update the previous entry.
    previousSelection.timesSelected += 1;
    previousSelection.selectedAt.push(now);

    // Limit the recent selections timestamps.
    previousSelection.selectedAt = _.last(
      previousSelection.selectedAt,
      this._timestampsLimit
    );

    // Remember which search queries this result was selected for so we can
    // remove this result from frecency later when cleaning up.
    previousSelection.queries[searchQuery] = true;
  }

  _cleanUpOldSelections(frecency: FrecencyData, selectedId: string): void {
    const recentSelections = frecency.recentSelections;

    // If frecency already contains the selected ID, shift it to the front.
    if (_.contains(recentSelections, selectedId)) {
      frecency.recentSelections = [
        selectedId,
        ..._.without(recentSelections, selectedId)
      ];
      return;
    }

    // Otherwise add the selected ID to the front of the list.
    if (recentSelections.length < this._recentSelectionsLimit) {
      frecency.recentSelections = [
        selectedId,
        ...recentSelections
      ];
      return;
    }

    // If the number of recent selections has gone over the limit, we'll remove
    // the least recently used ID from the frecency data.
    const idToRemove = recentSelections.pop();

    frecency.recentSelections = [
      selectedId,
      ..._.without(recentSelections, idToRemove)
    ];

    const selectionById = frecency.selections[selectedId];
    if (!selectionById) return;
    delete frecency.selections[selectedId];

    Object.keys(selectionById.queries).forEach((query) => {
      frecency.queries[query] = _.reject(frecency.queries[query], {
        id: selectedId
      });

      if (_.isEmpty(frecency.queries[query])) {
        delete frecency.queries[query];
      }
    });
  }

  // sort({
  //   searchQuery,
  //   resources
  // }) {
  //   _.each(resources, (resource) => resource.score = 0);

  //   const frecency = JSON.parse(localStorage.getItem('frecency')) || {};
  //   const frecencyForQuery = frecency[searchQuery];

  //   if (frecencyForQuery) {
  //     _.each(resources, (resource) => {
  //       const selection = _.findWhere(frecencyForQuery, {
  //         selectedId: resource._id
  //       });

  //       if (!selection) return;
  //       resource.score = calculateScore(selection.selectedAt);
  //     });
  //   }

  //   // For recent selections, sort by frecency. Otherwise, fall back to
  //   // server-side sorting.
  //   const [ recentSelections, otherSelections ] = _.partition(resources, (resource) => {
  //     return resource.score > 0;
  //   });

  //   return [
  //     ..._.sortBy(recentSelections, (resource) => -resource.score),
  //     ...otherSelections
  //   ];
  // }
}

// function calculateScore(timestamps) {
//   if (!timestamps) return 0;

//   const now = Date.now();
//   let totalScore = 0;

//   _.each(timestamps, (timestamp) => {
//     // Within 1 hour.
//     const hour = 1000 * 60 * 60;
//     if (timestamp >= now - hour) {
//       return totalScore += 100;
//     }

//     // Within 3 hours.
//     if (timestamp >= now - 3 * hour) {
//       return totalScore += 80;
//     }

//     // Within 12 hours.
//     if (timestamp >= now - 12 * hour) {
//       return totalScore += 60;
//     }

//     // Within 1 day.
//     const day = 24 * hour;
//     if (timestamp >= now - day) {
//       return totalScore += 40;
//     }

//     // Within 3 days.
//     if (timestamp >= now - 3 * day) {
//       return totalScore += 20;
//     }

//     // Within 1 week.
//     if (timestamp >= now - 7 * day) {
//       return totalScore += 10;
//     }
//   });

//   return totalScore;
// }

export default Frecency;
