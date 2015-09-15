var gulp = require('gulp'),
    del = require('del'),
    cordova = require('cordova-lib').cordova.raw,
    liveReload = require('gulp-livereload'),
    gutil = require('gulp-util'),
    watch = require('gulp-watch'),
    http = require('http'),
    ecstatic = require('ecstatic'),
    shell = require('gulp-shell'),
    print = require('gulp-print');

var watchGlob = 'www/**/*.{js,html,css}';

// Run the default task initially and start the live reload server
gulp.task('dev', liveReloadServer);

// reloader just pings the liveReload server and depends on the cordova prepare call
gulp.task('prepareAndReload', ['prepare'], reloader);

// runs 'cordova prepare' after rebuilding the whole 'www/' folder
gulp.task('prepare', cordovaPrepare);

// BEGIN Dev/LiveReload
function liveReloadServer() {
    liveReload.listen();
    //watch(watchGlob, ['prepareAndReload']);

    watch(watchGlob, function(files){
        files.pipe(print());
        gulp.run('prepareAndReload');
    });
}

function cordovaPrepare() {
    return gulp.src('').pipe(shell(['cordova prepare']));
}

function reloader() {
    return gulp.src('').pipe(liveReload());
}
//END Dev/LiveReload

function prepareCordova() {
    return gulp.src('').pipe(shell(['cordova-icon']));
}