const { defineConfig } = require('@vue/cli-service');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = defineConfig({
  transpileDependencies: ['quasar'],
  devServer: {
    port: 8083,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  configureWebpack: {
    optimization: {
      splitChunks: false,
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'mndyAzdo',
        filename: 'remoteEntry.js',
        exposes: {
          './CloneAzdoWiView': './src/views/CloneAzdoWiView.vue',
          './CreateAzdoDashboardView': './src/views/CreateAzdoDashboardView.vue',
          './BulkCreateAzdoWisView': './src/views/BulkCreateAzdoWisView.vue',
          './UpdateAzdoWiView': './src/views/UpdateAzdoWiView.vue',
        },
        shared: {
          vue: {
            singleton: true,
            requiredVersion: '^3.5.0',
          },
          pinia: {
            singleton: true,
            requiredVersion: '^2.1.6',
          },
          quasar: {
            singleton: true,
            requiredVersion: '^2.18.0',
          },
        },
      }),
    ],
  },
});
