var gulp = require('gulp')
  del = require('del'),
  cordova = require('cordova-lib').cordova.raw;

var APP_PATH = './app',
  CORDOVA_PATH = './cordova/www';

gulp.task('del-cordova', function(cb) {
  del([ CORDOVA_PATH + '/*' ], function() {
      cb();
  });
});

gulp.task('compile', [ 'del-cordova' ], function(cb) {
  return gulp.src([ APP_PATH + '/**/*' ])
      .pipe(gulp.dest(CORDOVA_PATH));
});

gulp.task('build', [ 'compile' ], function(cb) {
  process.chdir(__dirname + '/cordova');
  cordova
      .build()
      .then(function() {
          process.chdir('../');
          cb();
      });
});

gulp.task('emulate', [ 'compile' ], function(cb) {
  process.chdir(__dirname + '/cordova');
  cordova
      .run({ platforms: [ 'ios' ] })
      .then(function() {
          process.chdir('../');
          cb();
      });
});