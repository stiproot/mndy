const { defineConfig } = require('@vue/cli-service');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = defineConfig({
  transpileDependencies: ['quasar'],
  devServer: {
    port: 8082,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  configureWebpack: {
    optimization: {
      splitChunks: false, // Module Federation handles chunking
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'mndyVis',
        filename: 'remoteEntry.js',
        exposes: {
          './ChartComponent': './src/components/ChartComponent.vue',
          './NestedTreeMap': './src/components/charts/NestedTreeMapComponent.vue',
          './FilterControls': './src/components/FilterControlsComponent.vue',
          './Adapters': './src/adapters/index.ts',
        },
        shared: {
          vue: {
            singleton: true,
            requiredVersion: '^3.5.0',
          },
          'd3': {
            singleton: true,
            requiredVersion: '^7.8.5',
          },
          'quasar': {
            singleton: true,
            requiredVersion: '^2.18.0',
          },
        },
      }),
    ],
  },
});
