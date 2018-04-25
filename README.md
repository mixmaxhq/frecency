# Frecency

Plugin to add frecency to search results.
Original blog post on Frecency by Slack: https://slack.engineering/a-faster-smarter-quick-switcher-77cbc193cb60

## Using The Module

1) Install the npm module:
```sh
yarn add @mixmaxhq/frecency
```

2) Import Frecency into your code and create a Frecency instance.
```js
import Frecency from '@mixmaxhq/frecency';

export const peopleFrecency = new Frecency({
  key: 'people'   // Frecency data will be saved in localStorage with the key: 'frecency_people'.
});
```

3) When you select a search result in your code, update frecency:
```js
onSelect: (searchQuery, selectedResult) => {
  ...
  peopleFrecency.save({
    searchQuery,
    selectedId: selectedResult._id
  });
  ...
}
```

4) Before you display search results to your users, sort the result using frecency:
```js
onSearch: (searchQuery) => {
  ...
  return peopleFrecency.sort({
    searchQuery,
    results: [{
      _id: '57b409d4feea972a68ba1101',
      name: 'Brad Vogel',
      email: 'brad@mixmax.com'
    }, {
      _id: '57a09ceb7abdf9cb2c35818c',
      name: 'Brad Neuberg',
      email: 'neuberg@gmail.com'
    }, {
      ...
    }]
  });
}
```

## Configuring Frecency
Frecency will sort on `_id` by default. You can change this by setting an `idAttribute`:
```js
const frecency = new Frecency({
  key: 'people',
  idAttribute: 'id'
});

const frecency = new Frecency({
  key: 'people',
  idAttribute: 'email'
});

// Then when saving frecency, make sure to save the correct attribute as the selectedId.
frecency.save({
  searchQuery,
  selectedId: selectedResult.email
});

// Also accepts a function if your search results contains a
// mix of different types.
const frecency = new Frecency({
  key: 'people',
  idAttribute: (result) => result.id || result.email
});

// Depending on the result, save the appropriate ID in frecency.
frecency.save({
  searchQuery,
  selectedId: selectedResult.id
});

frecency.save({
  searchQuery,
  selectedId: selectedResult.email
});
```

Frecency saves timestamps of your recent selections to calculate a score.
More timestamps result in more granular frecency scores, but frecency data takes up more
space in localStorage.

You can modify this with an option in the constructor.
```js
new Frecency({
  key: 'people',
  timeStampsLimit: 20   // Limit is 10 by default.
});
```

Frecency stores a maximum number of IDs in localStorage. More IDs means more results
can be sorted with frecency, but frecency data takes up more space in localStorage.

To change the maximum number of different IDs stored in frecency:
```js
new Frecency({
  key: 'people',
  recentSelectionsLimit: 200   // Limit is 100 by default.
});
```
