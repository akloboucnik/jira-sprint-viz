var gulp       = require('gulp'),
    server     = require('gulp-develop-server'),
    livereload = require('gulp-livereload'),
    sass       = require('gulp-sass'),
    watch      = require('gulp-watch'),
    combine    = require('stream-combiner');

var options = {
    path: './server.js'
};

gulp.task( 'server:restart', function() {
    gulp.src( './client/scss/*.scss' )
    .pipe( sass() )
    .pipe( gulp.dest( './client/css' ) )
    .pipe( server(options) )
    .pipe( livereload() );
});

gulp.task('run', function() {
    server.listen(options);
});

gulp.task('dev', function() {
    gulp.start('server:restart');
    watch('./client/scss/*.scss').pipe(sassPipeline()).pipe(livereload());
    watch('./js/*.js').pipe(livereload());
});

gulp.task('default', ['run']);

function sassPipeline() {
    return combine(sass(), gulp.dest( './client/css' ));
}
