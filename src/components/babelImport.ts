import { transform } from '@babel/standalone';

console.log('BABEL LOADS');

const transformWidget = (code: string) => {
  const babelCode = transform(code, {
    presets: ['react', 'es2017'],
  }).code;
  return babelCode!.replace('"use strict";', '').trim();
};

export default transformWidget;
