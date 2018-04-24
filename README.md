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
