const { getDefaultConfig } = require('expo/metro-config')

/** Monorepo: Metro must watch and transform the shared workspace packages. */
const config = getDefaultConfig(__dirname)
config.watchFolders = [require('path').resolve(__dirname, '../../packages')]
module.exports = config
