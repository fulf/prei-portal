let gulp = require('gulp')
  , inline = require('gulp-inline')
  , babel = require('gulp-babel')
  , uglify = require('gulp-uglify')
  , minifyCss = require('gulp-minify-css');

gulp.task('html', () => {
   gulp.src('src/index.html')
      .pipe(inline({
         base: 'src/',
         js: [babel({presets: ['es2015']}), uglify],
         css: minifyCss
      }))
      .pipe(gulp.dest('data/'));
});

gulp.task('img', () => {
   gulp.src('src/img/*')
      .pipe(gulp.dest('data/img'));
});

gulp.task('default', ['html', 'img']);
