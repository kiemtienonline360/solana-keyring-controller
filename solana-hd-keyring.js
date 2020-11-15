const EventEmitter = require('events').EventEmitter;
const Wallet = require('./solana-wallet');
const SimpleKeyring = require('./solana-simple-keyring');
const bip39 = require('bip39');
const nacl = require('tweetnacl');;

// Options:
const type = 'HD Key Tree'

class HdKeyring extends SimpleKeyring {

  /* PUBLIC METHODS */
  constructor (opts = {}) {
    super();
    this.type = type;
    if (opts!=null) {
      this.deserialize(opts).then(function(wallets) {});
    }
  }

  serialize () {
    return {
      mnemonic: this.mnemonic,
      numberOfAccounts: this.wallets.length
    };
  }

  async deserialize (opts) {
    this.opts = opts || {};
    this.wallets = [];
    this.mnemonic = null;

    if (opts.mnemonic) {
      this._initFromMnemonic(opts.mnemonic);
    }

    if (opts.numberOfAccounts) {
      return await this.addAccounts(opts.numberOfAccounts);
    }
  }

  async addAccounts (numberOfAccounts = 1) {
    if (!this.mnemonic) {
      this._initFromMnemonic(bip39.generateMnemonic());
    }

    const oldLen = this.wallets.length;
    const newWallets = [];
    let seed = await Wallet.mnemonicToSeed(this.mnemonic);
    for (let i = oldLen; i < numberOfAccounts + oldLen; i++) {
      let wallet = Wallet.fromSeed(seed, 0, i);
      newWallets.push(wallet);
      this.wallets.push(wallet);
    }
    const hexWallets = newWallets.map((w) => {
      return w.getAddress();
    });
    return Promise.resolve(hexWallets);
  }

  /* PRIVATE METHODS */
  _initFromMnemonic (mnemonic) {
    this.mnemonic = mnemonic;
  }
}

HdKeyring.type = type
module.exports = HdKeyring