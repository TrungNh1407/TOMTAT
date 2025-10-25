import gulp from 'gulp';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const { src, dest, series, watch } = gulp;

// Define paths
const paths = {
  css: {
    src: './index.css',
    dest: 'public/',
    watch: ['./index.css', './tailwind.config.js', './**/*.{js,ts,jsx,tsx}'],
  }
};

// CSS processing task
function cssTask() {
  const postcssPlugins = [
    tailwindcss,
    autoprefixer,
    cssnano(),
  ];
  return src(paths.css.src, { allowEmpty: true })
    .pipe(sourcemaps.init())
    .pipe(postcss(postcssPlugins))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(paths.css.dest));
}

// Watch for changes
function watchTask() {
  watch(paths.css.watch, cssTask);
}

// Define complex tasks
const build = series(cssTask);
const dev = series(cssTask, watchTask);

export { 
  cssTask as css,
  dev as watch,
};
export default build;
