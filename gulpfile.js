var gulp = require('gulp'),
    del = require('del'),
    cordova = require('cordova-lib').cordova.raw,
    liveReload = require('gulp-livereload'),
    gutil = require('gulp-util'),
    watch = require('gulp-watch'),
    http = require('http'),
    ecstatic = require('ecstatic'),
    shell = require('gulp-shell'),
    runSequence = require("run-sequence"),
    insertLines = require('gulp-insert-lines'),
    fs = require("fs"),
    print = require('gulp-print');


var watchGlob = 'www/**/*.{js,html,css}';
var googleMapsHtml = "";

// The default task downloads Cordova plugins, Bower libraries
gulp.task("default", function (cb) {
    runSequence("plugins", "libs", cb);
});

// Used to download all of the bower dependencies as defined in bower.json
gulp.task("libs", function(cb) {
    exec("bower-installer", function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

/**
 * Used to download and configure each platform with the Cordova plugins as defined
 * in the cordovaPlugins section of the package.json file.
 *
 * This is equivalent to using the "cordova plugins add pluginName" command for each
 * of the plugins.
 */
gulp.task("plugins", ["git-check"], function(cb) {
    var pluginList = JSON.parse(fs.readFileSync("package.json", "utf8")).cordovaPlugins;

    async.eachSeries(pluginList, function(plugin, eachCb) {
        var pluginName,
            additionalArguments = "";

        if (typeof(plugin) === "object" && typeof(plugin.locator) === "string") {
            pluginName = plugin.locator;

            if (plugin.variables) {
                Object.keys(plugin.variables).forEach(function (variable) {
                    additionalArguments += " --variable " + variable + "=\"" + plugin.variables[variable] + "\"";
                });
            }
        }
        else if (typeof(plugin) === "string") {
            pluginName = plugin;
        }
        else {
            cb(new Error("Unsupported plugin object type (must be string or object with a locator property)."));
            return;
        }

        exec("cordova plugin add " + pluginName + additionalArguments, function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            eachCb(err);
        });

    }, cb);
});

// Builds and copies the files need to run the app in the web
gulp.task("web:build", function (cb) {
	runSequence("clean:web", "web:copy", "web:replaceGoogleMaps", "web:addHeader", cb);
});

/**
 * Removes the web directory.
 */
gulp.task("clean:web", function () {
	return del([
		"platforms/browser/www"
	]);
});

// Adds web specific items to the index.html's header
gulp.task("web:replaceGoogleMaps", function (cb) {
	gulp.src('platforms/browser/www/index.html')
				.pipe(remove('[data-rgRemove-GoogleMaps]'))
                .pipe(fs.readFile("../../data/googleMap.txt", "utf-8", function(err, _data) {
                    this.googleMapsHtml = _data;
                })).pipe(insertLines({
                    'before': /<\/body>$/,
                    'lineBefore': this.googleMapsHtml
                }))
				.pipe(gulp.dest('tmp'))
				.on("end", function () {
					del(["platforms/browser/www/index.html"])
						.then(function (paths) {
							gulp.src('tmp/index.html')
							.pipe(gulp.dest('platforms/browser/www'));
						});
				});
});

// Adds web specific items to the index.html's header
gulp.task("web:addHeader", function () {
	return gulp.src('platforms/browser/www/index.html')
	.pipe(insertLines({
		'before': /<\/head>$/,
		'lineBefore': '<link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-57x57.png"><link rel="apple-touch-icon" sizes="60x60" href="/apple-touch-icon-60x60.png"><link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-72x72.png"><link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png"><link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114x114.png"><link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png"><link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144x144.png"><link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png"><link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32"><link rel="icon" type="image/png" href="/android-chrome-192x192.png" sizes="192x192"><link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96"><link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16"><link rel="manifest" href="/manifest.json"><link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5"><meta name="msapplication-TileColor" content="#da532c"><meta name="msapplication-TileImage" content="/mstile-144x144.png"><meta name="theme-color" content="#ffffff">'
	}))
	.pipe(gulp.dest('platforms/browser/www'));
});


/**
 * Used to perform a file clean-up of the project. This removes all files and directories
 * that don't need to be committed to source control by delegating to several of the clean
 * sub-tasks.
 */
gulp.task("clean", ["clean:tmp", "clean:node", "clean:bower", "clean:platforms", "clean:plugins", "clean:chrome"]);

/**
 * Removes the tmp directory.
 */
gulp.task("clean:tmp", function (cb) {
    del([
        "tmp"
    ], cb);
});

/**
 * Removes the node_modules directory.
 */
gulp.task("clean:node", function (cb) {
    del([
        "node_modules"
    ], cb);
});

/**
 * Removes the bower_components directory.
 */
gulp.task("clean:bower", function (cb) {
    del([
        "bower_components"
    ], cb);
});

/**
 * Removes the platforms directory.
 */
gulp.task("clean:platforms", function (cb) {
    del([
        "platforms"
    ], cb);
});

/**
 * Removes the plugins directory.
 */
gulp.task("clean:plugins", function (cb) {
    del([
        "plugins"
    ], cb);
});

/**
 * An default task provided by Ionic used to check if Git is installed.
 */
gulp.task("git-check", function(done) {
    if (!sh.which("git")) {
        console.log(
            "  " + gutil.colors.red("Git is not installed."),
            "\n  Git, the version control system, is required to download most dependencies.",
            "\n  Download git here:", gutil.colors.cyan("http://git-scm.com/downloads") + ".",
            "\n  Once git is installed, run \"" + gutil.colors.cyan("gulp install") + "\" again."
        );
        done(new Error("Git is not installed."));
        return;
    }

    done();
});

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