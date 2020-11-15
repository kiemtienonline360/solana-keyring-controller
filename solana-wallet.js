'use strict';

const Web3 = require('@solana/web3.js');
const bip39 = require('bip39');
const bip32 = require('bip32');
const nacl = require('tweetnacl');
var randomBytes = require('randombytes');

const Account = Web3.Account;

var Wallet = function Wallet(secretKey) {
  this.account = new Account(secretKey);
};

Wallet.prototype.getAccount = function () {
  return this.account;
};

Wallet.prototype.getSecretKey = function () {
  return this.account.secretKey;
};

Wallet.prototype.getSecretKeyString = function () {
  return Buffer.from(this.getSecretKey()).toString('hex');
};

Wallet.prototype.getPublicKey = function () {
  return this.account.publicKey;
};

Wallet.prototype.getPublicKeyString = function () {
  return this.getPublicKey().toBuffer().toString('hex');
};

Wallet.prototype.getAddress = function () {
  return this.account.publicKey.toString();
};

Wallet.prototype.getAddressString = function () {
  return this.getAddress();
};

Wallet.fromSeed = function(seed, walletIndex=0, accountIndex = 0) {
  const derivedSeed = bip32.fromSeed(seed).derivePath(`m/501'/${walletIndex}'/0/${accountIndex}`).privateKey;
  let secretKey = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
  return new Wallet(secretKey);
}

Wallet.fromPrivateKey = function(privateKey) {
  let secretKey = nacl.sign.keyPair.fromSeed(privateKey).secretKey;
  return new Wallet(secretKey);
}

Wallet.fromSecretKey = function(secretKey) {
  return new Wallet(secretKey);
}

Wallet.generateMnemonic = async function() {
  const mnemonic = bip39.generateMnemonic(128);
  const seed = await bip39.mnemonicToSeed(mnemonic);
  return { mnemonic, seed: seed };
}

Wallet.generateWallet = function() {
  var privKey = randomBytes(32);
  return Wallet.fromPrivateKey(privKey);
}

Wallet.toPublicKey = function(address) {
  return new Web3.PublicKey(address);
}

Wallet.mnemonicToSeed = function(mnemonic) {
  return bip39.mnemonicToSeed(mnemonic);
}

Wallet.generateMnemonicAndWallet = function() {
  let mnemoticInfo = Wallet.generateMnemonic();
  let w = Wallet.fromSeed(mnemoticInfo.seed, 1, 0);
  return { mnemonic: mnemoticInfo.mnemonic, wallet: w};
}

Wallet.isValidAddress = function(address) {
  let ret = false;
  try {
    new Web3.PublicKey(address);
    ret = true;
  } catch (ex) {
    console.warn("Address " + address + " is invalid!");
  }
  return ret;
}

Wallet.isValidMnemonic = function(mnemonic) {
  return bip39.validateMnemonic(mnemonic);
}

module.exports = Wallet;