module.exports = {
  "/api": {
    target: "https://api.twitter.com/2",
    secure: true,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    },
    logLevel: "debug"
  },
  "/oauth2": {
    target: "https://api.twitter.com",
    secure: true,
    changeOrigin: true,
    logLevel: "debug"
  }
};
