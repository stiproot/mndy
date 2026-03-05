const { defineConfig } = require('@vue/cli-service')
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = defineConfig({
  transpileDependencies: [
    'quasar'
  ],

  pluginOptions: {
    quasar: {
      rtlSupport: false
    }
  },

  configureWebpack: {
    plugins: [
      new ModuleFederationPlugin({
        name: 'mndyUi',
        remotes: {
          mndyVis: 'mndyVis@http://localhost:8082/remoteEntry.js',
          mndyAzdo: 'mndyAzdo@http://localhost:8083/remoteEntry.js',
        },
        shared: {
          vue: { singleton: true, requiredVersion: '^3.5.0' },
          pinia: { singleton: true, requiredVersion: '^2.1.6' },
          quasar: { singleton: true, requiredVersion: '^2.18.0' },
        },
      }),
    ],
  },
})
