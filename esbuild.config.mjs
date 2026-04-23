import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const isProd = process.argv.includes('--prod');

function copyFileToDir(src, destDir) {
  const filename = path.basename(src);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, path.join(destDir, filename));
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function cleanDist() {
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
}

const common = {
  bundle: true,
  sourcemap: isProd ? false : 'inline',
  minify: isProd,
  target: 'es2020',
  platform: 'browser',
  format: 'esm',
};

const context = await esbuild.context({
  ...common,
  entryPoints: [
    'src/content.ts',
    'src/background.ts',
    'src/ui/popup/index.ts',
    'src/ui/settings/index.ts',
  ],
  outdir: 'dist',
  plugins: [
    {
      name: 'copy-assets',
      setup(build) {
        let isWatchingExtra = false;
        build.onEnd(() => {
          copyFileToDir('manifest.json', 'dist');
          copyFileToDir('styles.css', 'dist');
          copyFileToDir('src/ui/popup/index.html', 'dist/ui/popup');
          copyFileToDir('src/ui/settings/index.html', 'dist/ui/settings');
          copyDirRecursive('src/_locales', 'dist/_locales');
          copyDirRecursive('src/assets', 'dist/assets');
          console.log('[+] Build finished');

          if (!isWatchingExtra && !isProd) {
            isWatchingExtra = true;
            let debounceTimeout;

            const filesToWatch = [
              { src: 'styles.css', dest: 'dist' },
              { src: 'src/ui/popup/index.html', dest: 'dist/ui/popup' },
              { src: 'src/ui/settings/index.html', dest: 'dist/ui/settings' },
            ];

            filesToWatch.forEach(({ src, dest }) => {
              fs.watch(src, () => {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                  console.log(`[watch] ${path.basename(src)} changed`);
                  copyFileToDir(src, dest);
                }, 100);
              });
            });
          }
        });
      },
    },
  ],
});

if (isProd) {
  cleanDist();
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
  console.log('[+] Watching...');
}
