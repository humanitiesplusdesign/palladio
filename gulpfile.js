var gulp = require('gulp');

var mainBowerFiles = require('main-bower-files');
var webserver = require('gulp-webserver');
var merge = require('merge-stream');
var concat = require('gulp-concat');
var filter = require('gulp-filter');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var order = require('gulp-order');
var angularTemplates = require('gulp-angular-templates');

var palladioSources = [
	"./lib/crossfilter/crossfilter-helpers.js",
	"./lib/bootstrap-tag/bootstrap-tag.js",
	"./lib/d3/d3.timeline.js",
	"./lib/d3/d3.graph.js",
	"./lib/d3/d3.svg.multibrush.js",
	"./lib/d3-bootstrap/d3-bootstrap-plugins.js",
	"./lib/codemirror/placeholder.js",
	// "./lib/yasqe/yasqe.min.js",
	// "./lib/yasr/yasr.min.js",
	"./src/js/**/*.js",
	"./src/components/**/*.js",
	"./src/unfinished_components/**/*.js",
	"./bower_components/bootstrap/js/tooltip.js"
];
var palladioCSS = [ "./lib/**/*.css", "./src/**/*.css" ];
var palladioTemplate = [
	"./src/html/*.html",
	// "./src/unfinished_components/**/*.html",
	"./src/components/**/*.html"
];

var filterByExtension = function(extension){
    return filter(function(file){
        return file.path.match(new RegExp('.' + extension + '$'));
    });
};

gulp.task('scripts', function () {
	var files = gulp.src(
			mainBowerFiles({includeDev: true})
				.concat('node_modules/svgsaver/browser.js')
				.concat(palladioSources)
		)
		.pipe(filterByExtension("js"))
		.pipe(concat('jsFiles.js'));

	var templates = gulp.src(palladioTemplate)
		.pipe(angularTemplates({ module: 'palladio', basePath: 'partials/' }))
		.pipe(rename('templates.tmpl'));

	merge(files, templates)
		.pipe(order(['*.js', '*.tmpl']))
        .pipe(concat('palladio.js'))
        .pipe(gulp.dest('./'))
				.pipe(uglify())
        .pipe(rename('palladio.min.js'))
        .pipe(gulp.dest('./'));;
});

gulp.task('css', function () {
	gulp.src(mainBowerFiles({includeDev: true})
				.concat(palladioCSS))
		.pipe(filterByExtension("css"))
		.pipe(concat('palladio.css'))
		.pipe(gulp.dest('./'));
});

gulp.task('images', function () {
	gulp.src('./bower_components/mapbox.js/images/*')
		.pipe(gulp.dest('./images/'));
});

// Watch Files For Changes
gulp.task('watch', function() {
	gulp.watch(["bower.json"], ['scripts', 'css']);
    gulp.watch(palladioSources, ['scripts']);
    gulp.watch(palladioCSS, ['css']);
    gulp.watch(palladioTemplate, ['scripts']);
});

gulp.task('default', ['scripts', 'css', 'images', 'watch']);
gulp.task('all', ['scripts', 'css', 'images']);
gulp.task('serve', ['webserver']);