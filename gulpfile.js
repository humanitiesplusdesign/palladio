var gulp = require('gulp');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var angularTemplates = require('gulp-angular-templates');

var palladioSources = [
	"./lib/crossfilter/crossfilter.min.js",
	"./lib/crossfilter/crossfilter-helpers.js",
	"./lib/jquery/jquery.js",
	"./lib/jquery-ui/jquery-ui.min.js",
	"./lib/jquery/jquery.mousewheel.js",
	"./lib/jquery/jquery.jscrollpane.min.js",
	"./lib/bootstrap/bootstrap.min.js",
	"./lib/bootstrap-select/bootstrap-select.min.js",
	"./lib/bootstrap-datepicker/bootstrap-datepicker.js",
	"./lib/bootstrap-tag/bootstrap-tag.js",
	"./lib/d3/d3.min.js",
	"./lib/d3/d3.timeline.js",
	"./lib/d3/d3.graph.js",
	"./lib/d3/d3.svg.multibrush.js",
	"./lib/d3-bootstrap/d3-bootstrap-plugins.js",
	"./lib/spin/spin.min.js",
	"./lib/filesaver/FileSaver.min.js",
	"./lib/blob/Blob.js",
	"./lib/codemirror/codemirror.js",
	"./lib/codemirror/placeholder.js",
	"./lib/leaflet/leaflet.js",
	"./lib/leaflet-search/leaflet-search.js",
	"./lib/colorbrewer/colorbrewer.js",
	"./lib/spin/spin.min.js",
	"./lib/modernizr/modernizr.custom.js",
	"./lib/classie/classie.js",
	"./lib/angular/angular.min.js",
	"./lib/angular/angular-route.min.js",
	"./lib/angular/angular-sanitize.min.js",
	"./lib/angular/angular-strap.min.js",
	"./lib/angular-ui-codemirror/ui-codemirror.js",
	"./lib/queue/queue.min.js",
	"./src/**/*.js"
];
var palladioCSS = [ "./lib/**/*.css", "./css/**/*.css", "./src/**/*.css" ];
var palladioTemplate = [ "./src/html/*.html", "./src/visualizations/**/*.html" ];

gulp.task('scripts', function () {
	gulp.src(palladioSources)
		.pipe(concat('palladio.js'))
        .pipe(gulp.dest('./'))
        .pipe(gulp.dest('./apps/palladio/'))
        .pipe(rename('palladio.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./apps/palladio/'));
});

gulp.task('css', function () {
	gulp.src(palladioCSS)
		.pipe(concat('palladio.css'))
        .pipe(gulp.dest('./apps/palladio/'));
});

gulp.task('html', function () {
    return gulp.src(palladioTemplate)
        .pipe(angularTemplates({ module: 'palladio', basePath: 'partials/' }))
        .pipe(concat('templates.js'))
        .pipe(gulp.dest('./apps/palladio/'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch(palladioSources, ['scripts']);
    gulp.watch(palladioCSS, ['css']);
    gulp.watch(palladioTemplate, ['html']);
});

gulp.task('default', ['scripts', 'css', 'html', 'watch']);
gulp.task('all', ['scripts', 'css', 'html']);