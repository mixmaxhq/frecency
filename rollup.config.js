import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';

const pkg = require('./package.json');

const presets = [
  ['env', { modules: false }],
  'flow'
];

const commonPlugins = [
  babel({
    babelrc: false,
    presets,
    plugins: [
      'external-helpers'
    ],
    exclude: [ 'node_modules/**' ]
  }),
];

const commonConfig = {
  input: 'src/index.js',
};

export default [
  {
    ...commonConfig,
    output: [
      {
        format: 'es',
        file: pkg.browser['./index.js'],
      }
    ],
    plugins: commonPlugins.concat([
      replace({
        __SERVER__: JSON.stringify(false),
      }),
    ]),
  },
  {
    ...commonConfig,
    output: [
      {
        format: 'cjs',
        file: pkg.main,
      }
    ],
    plugins: commonPlugins.concat([
      replace({
        __SERVER__: JSON.stringify(true),
      }),
    ]),
  },
]
