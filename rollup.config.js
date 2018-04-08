import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

const pkg = require('./package.json');

const presets = [
  ['env', { modules: false }],
  'flow'
];

export default {
  input: 'src/browser/index.js',
  plugins: [
    nodeResolve({
      browser: true,
    }),
    babel({
      babelrc: false,
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
