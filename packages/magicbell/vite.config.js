import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

import baseConfig from '../../scripts/vite/vite.config.js';

const extensions = {
  cjs: '.cjs',
  esm: '.mjs',
};

export function copyStatics() {
  return {
    name: 'copy statics',
    async buildEnd() {
      try {
        const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        // rewrite file paths
        for (const key of ['main', 'module', 'typings']) {
          pkgJson[key] = pkgJson[key].replace(pkgJson.publishConfig.directory, '.');
        }

        for (const key of Object.keys(pkgJson.exports)) {
          for (const [format, file] of Object.entries(pkgJson.exports[key])) {
            pkgJson.exports[key][format] = file.replace(pkgJson.publishConfig.directory, '.');
          }
        }

        // delete redundant properties
        for (const key of ['files', 'devDependencies', 'size-limit', 'scripts', 'publishConfig', 'source']) {
          delete pkgJson[key];
        }

        fs.mkdirSync('dist', { recursive: true });
        fs.writeFileSync('dist/package.json', JSON.stringify(pkgJson, null, 2));

        for (const file of ['LICENSE', 'CHANGELOG.md', 'README.md']) {
          fs.copyFileSync(file, path.join('dist', file));
        }
      } catch (error) {
        this.error(`Failed to copy statics: ${error.message}`);
      }
    },
  };
}

export default defineConfig(async (configEnv) => {
  const base = await baseConfig(configEnv);

  base.build.lib = {
    entry: process.env.ENTRY,
    formats: ['esm', 'cjs'],
    fileName: (format) => path.basename(process.env.ENTRY, '.ts') + extensions[format] || '.js',
  };

  base.plugins.push(copyStatics());

  // don't minify, consumer packages can take care of that, this eases their debugging
  base.build.minify = false;
  base.esbuild.minify = false;
  base.esbuild.minifyIdentifiers = false;
  base.esbuild.minifySyntax = false;
  base.esbuild.minifyWhitespace = false;

  return base;
});
