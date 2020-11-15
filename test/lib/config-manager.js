const MetamaskConfig = require('./config.js')

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com'
const TESTNET_RPC = 'https://testnet.solana.com'
const DEVNET_RPC = 'https://devnet.solana.com'
const LOCALNET_RPC = 'http://localhost:8899'

/* The config-manager is a convenience object
 * wrapping a pojo-migrator.
 *
 * It exists mostly to allow the creation of
 * convenience methods to access and persist
 * particular portions of the state.
 */
module.exports = ConfigManager
function ConfigManager (opts) {
  // ConfigManager is observable and will emit updates
  this._subs = []
  this.store = opts.store
}

ConfigManager.prototype.setConfig = function (config) {
  const data = this.getData()
  data.config = config
  this.setData(data)
  this._emitUpdates(config)
}

ConfigManager.prototype.getConfig = function () {
  const data = this.getData()
  return data.config
}

ConfigManager.prototype.setData = function (data) {
  this.store.putState(data)
}

ConfigManager.prototype.getData = function () {
  return this.store.getState()
}

ConfigManager.prototype.setWallet = function (wallet) {
  const data = this.getData()
  data.wallet = wallet
  this.setData(data)
}

ConfigManager.prototype.setVault = function (encryptedString) {
  const data = this.getData()
  data.vault = encryptedString
  this.setData(data)
}

ConfigManager.prototype.getVault = function () {
  const data = this.getData()
  return data.vault
}

ConfigManager.prototype.getKeychains = function () {
  return this.getData().keychains || []
}

ConfigManager.prototype.setKeychains = function (keychains) {
  const data = this.getData()
  data.keychains = keychains
  this.setData(data)
}

ConfigManager.prototype.getSelectedAccount = function () {
  const config = this.getConfig()
  return config.selectedAccount
}

ConfigManager.prototype.setSelectedAccount = function (address) {
  const config = this.getConfig()
  config.selectedAccount = address
  this.setConfig(config)
}

ConfigManager.prototype.getWallet = function () {
  return this.getData().wallet
}

// Takes a boolean
ConfigManager.prototype.setShowSeedWords = function (should) {
  const data = this.getData()
  data.showSeedWords = should
  this.setData(data)
}

ConfigManager.prototype.getShouldShowSeedWords = function () {
  const data = this.getData()
  return data.showSeedWords
}

ConfigManager.prototype.setSeedWords = function (words) {
  const data = this.getData()
  data.seedWords = words
  this.setData(data)
}

ConfigManager.prototype.getSeedWords = function () {
  const data = this.getData()
  return data.seedWords
}
ConfigManager.prototype.setRpcTarget = function (rpcUrl) {
  const config = this.getConfig()
  config.provider = {
    type: 'rpc',
    rpcTarget: rpcUrl,
  }
  this.setConfig(config)
}

ConfigManager.prototype.setProviderType = function (type) {
  const config = this.getConfig()
  config.provider = {
    type,
  }
  this.setConfig(config)
}

ConfigManager.prototype.useEtherscanProvider = function () {
  const config = this.getConfig()
  config.provider = {
    type: 'etherscan',
  }
  this.setConfig(config)
}

ConfigManager.prototype.getProvider = function () {
  const config = this.getConfig()
  return config.provider
}

ConfigManager.prototype.getCurrentRpcAddress = function () {
  const provider = this.getProvider()
  if (!provider) {
    return null
  }
  switch (provider.type) {

    case 'mainnet':
      return MAINNET_RPC

    case 'testnet':
      return TESTNET_RPC

    case 'devnet':
      return DEVNET_RPC

    case 'localnet':
      return LOCALNET_RPC

    default:
      return provider && provider.rpcTarget ? provider.rpcTarget : TESTNET_RPC
  }
}

//
// Tx
//

ConfigManager.prototype.getTxList = function () {
  const data = this.getData()
  if (data.transactions !== undefined) {
    return data.transactions
  }
  return []

}

ConfigManager.prototype.setTxList = function (txList) {
  const data = this.getData()
  data.transactions = txList
  this.setData(data)
}

// wallet nickname methods

ConfigManager.prototype.getWalletNicknames = function () {
  const data = this.getData()
  const nicknames = ('walletNicknames' in data) ? data.walletNicknames : {}
  return nicknames
}

ConfigManager.prototype.nicknameForWallet = function (account) {
  const address = account
  const nicknames = this.getWalletNicknames()
  return nicknames[address]
}

ConfigManager.prototype.setNicknameForWallet = function (account, nickname) {
  const address = account
  const nicknames = this.getWalletNicknames()
  nicknames[address] = nickname
  const data = this.getData()
  data.walletNicknames = nicknames
  this.setData(data)
}

// observable

ConfigManager.prototype.getSalt = function () {
  const data = this.getData()
  return data.salt
}

ConfigManager.prototype.setSalt = function (salt) {
  const data = this.getData()
  data.salt = salt
  this.setData(data)
}

ConfigManager.prototype.subscribe = function (fn) {
  this._subs.push(fn)
  const unsubscribe = this.unsubscribe.bind(this, fn)
  return unsubscribe
}

ConfigManager.prototype.unsubscribe = function (fn) {
  const index = this._subs.indexOf(fn)
  if (index !== -1) {
    this._subs.splice(index, 1)
  }
}

ConfigManager.prototype._emitUpdates = function (state) {
  this._subs.forEach(function (handler) {
    handler(state)
  })
}

ConfigManager.prototype.setLostAccounts = function (lostAccounts) {
  const data = this.getData()
  data.lostAccounts = lostAccounts
  this.setData(data)
}

ConfigManager.prototype.getLostAccounts = function () {
  const data = this.getData()
  return data.lostAccounts || []
}
