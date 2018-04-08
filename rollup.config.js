import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

const flow = require('rollup-plugin-flow');
const pkg = require('./package.json');

const presets = [[
  'env',
  {
    modules: false
  }
]];

const external = [
  'underscore'
];

export default {
  input: 'src/browser/index.js',
  external,
  plugins: [
    flow(),
    nodeResolve({
      browser: true,
      // Needed in addition to the `external` definition to suppress `require('underscore')`
      // in `/common`: https://github.com/rollup/rollup-plugin-node-resolve/issues/72
      skip: ['underscore']
    }),
    babel({
      presets,
      plugins: [
        'external-helpers'
      ],
      exclude: [ 'node_modules/**' ]
    })
  ],
  output: [
    {
      format: 'es',
      file: pkg.browser['index.js']
    }
  ]
};
