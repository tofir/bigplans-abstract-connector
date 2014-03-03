'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    'jasmine_node': {
      projectRoot: './spec', // load only specs containing specNameMatcher
      forceExit: true,
      verbose: false,
      captureExceptions: true
    },
    env: {
      test: { NODE_ENV: 'test' }
    },
    jshint: {
      files: [
        'Gruntfile.js',
        'package.json',
        'requirements.json',
        '.jshintrc',
        'lib/**/*.js',
        'spec/**/*.js',
        '*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jasmine-node');

  grunt.registerTask('test', ['jshint', 'jasmine_node']);
  grunt.registerTask('default', ['test']);
};
