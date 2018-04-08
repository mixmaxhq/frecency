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

export default {
  input: 'src/browser/index.js',
  plugins: [
    flow(),
    nodeResolve({
      browser: true,
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
      file: pkg.browser['./index.js']
    }
  ]
};
