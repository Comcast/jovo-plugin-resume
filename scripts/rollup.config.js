import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
// import { terser } from 'rollup-plugin-terser';

export default {
  input: 'dist/index.js',
  output: {
    file: 'build/index.js',
    format: 'cjs'    
  },
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    json()
    // terser()
  ]
};
