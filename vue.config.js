const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: 'dist',
  devServer: {
    allowedHosts: 'all',
    client: {
      webSocketURL: 'wss://pkmu-backoffice.dispsiau.org/ws'
    },
  },
})