
module.exports = function(grunt) {
  'use strict';

  grunt.option('color', false);
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-coffeelint');

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    coffeelint: {
      app: ['test/**/*.coffee']
    },
    jshint: {
      files: ['Gruntfile.js', 'app.js', 'lib/**/*.js', '!lib/marked-async.js', 'routes/**/*.js', 'middleware/**/*.js', 'test/**/*.js'],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true
      },
      globals: {
        exports: true
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', /*'coffeelint'*/]);

};