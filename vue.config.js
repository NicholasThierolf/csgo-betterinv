module.exports = {
  //...
  //...
  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
      externals: ["vue-apexcharts"],
      nodeModulesPath: ["./node_modules"],

      // Or, for multiple preload files:
      // preload: { preload: 'src/preload.js', otherPreload: 'src/preload2.js' }
    },
  },

  transpileDependencies: ["vuetify"],
};
