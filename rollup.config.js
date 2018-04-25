import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');

const presets = [
  ['env', { modules: false }],
  'flow'
];

export default {
  input: 'src/browser/index.js',
  plugins: [
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
