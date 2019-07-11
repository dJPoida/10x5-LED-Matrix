module.exports = {
    'parser': 'babel-eslint',
    'env': {
      'browser': true,
      'commonjs': true,
      'es6': true,
      'node': true
    },
    'extends': 'airbnb',
    'globals': {
      'Atomics': 'readonly',
      'SharedArrayBuffer': 'readonly'
    },
    'parserOptions': {
      'ecmaVersion': 2018,
      'sourceType': 'module',
      'ecmaFeatures': {
        'jsx': true,
        'classes': true,
        'defaultParams': true
      }
    },
    'plugins': [
      'react'
    ],
    'rules': {
      'class-methods-use-this': 0,
      'no-underscore-dangle': 0,
      'no-param-reassign': 0,
      'operator-linebreak': 0,
      'brace-style': 0,
      'default-case': 0,
      'max-len': ["error", { "code": 185 }],
      'linebreak-style': 0,
      'padded-blocks': 0,
      'quote-props': 0,
      'jsx-a11y/no-static-element-interactions': 0,
      'jsx-a11y/click-events-have-key-events': 0,
      'jsx-a11y/media-has-caption': 0,
    }
  };