// @flow
/**
 * Performs a by-word prefix match to determine if a string is a sub query
 * of a given query. For example:
 * - 'de tea' is a subquery of 'design team' because 'de' is a substring of 'design'
 *   and 'tea' is a substring of 'team'.
 * - 'team desi' is a subquery of 'design team' because we don't consider order.
 * @param {String} str - The string to test to see if its a subquery.
 * @param {String} query - The full query.
 * @return {Boolean} Whether str is a by-word prefix match of query.
 */
export function isSubQuery(str: ?string, query: string): boolean {
  if (!str) return false;

  // Split the string into words and order reverse-alphabetically.
  const searchStrings = str.toLowerCase().split(' ').sort((a, b) => b > a ? 1 : -1);
  const queryStrings = query.toLowerCase().split(' ').sort((a, b) => b > a ? 1 : -1);

  // Make sure each search string is a prefix of at least 1 word in the query strings.
  for (const searchString of searchStrings) {
    // Ignore extra whitespace.
    if (searchString === '') continue;

    const match = queryStrings.find((queryString) => {
      return queryString.startsWith(searchString);
    });

    if (!match) return false;

    // Remove the matched query string so we don't match it again.
    queryStrings.splice(queryStrings.indexOf(match), 1);
  }

  return true;
}

// Returns true if storageProvider respect is enabled. False otherwise.
export function storageCapabilitiesAvailable(storageProvider: any) {
  const mod = '____featurecheck____';
  try {
    storageProvider.setItem(mod, mod);
    storageProvider.removeItem(mod);
    return true;
  } catch (e) {
    return false;
  }
}
