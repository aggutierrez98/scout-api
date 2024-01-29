module.exports = {
    apps : [{
      name      : 'scout-api',
      script    : 'dist/index.js',
      node_args : '-r dotenv/config',
    }],
  }