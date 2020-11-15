const EventEmitter = require('events').EventEmitter;
const Wallet = require('./solana-wallet');
const type = 'Simple Key Pair';
const createKeccakHash = require('keccak');

class SimpleKeyring extends EventEmitter {
  /* PUBLIC METHODS */
  constructor (opts) {
    super();
    this.type = type;
    this.wallets = [];
    this.deserialize(opts);
  }

  serialize () {
    return this.wallets.map(w => w.getSecretKeyString());
  }

  deserialize (secretKeys = []) {
    try {
      this.wallets = secretKeys.map((secretKey) => {
        let secretKeyBin = Buffer.from(secretKey, "hex");
        const wallet = Wallet.fromSecretKey(secretKeyBin);
        return wallet;
      });
    } catch (ex) {
      console.error("Unable to deserialize the secret keys", ex);
    }
  }

  addAccounts (n = 1) {
    const newWallets = []
    for (let i = 0; i < n; i++) {
      newWallets.push(Wallet.generateWallet());
    }
    this.wallets = this.wallets.concat(newWallets);
    const hexWallets = newWallets.map((w) => w.getAddress());
    return Promise.resolve(hexWallets);
  }

  getAccounts () {
    return Promise.resolve(this.wallets.map((w) => w.getAddress()));
  }

  getWallets () {
    return this.wallets;
  }

  getWallet (idx) {
    return this.wallets[idx];
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction (address, tx, opts = {}) {
    // const privKey = this.getPrivateKeyFor(address, opts);
    // tx.sign(privKey)
    // return Promise.resolve(tx)
  }

  // For eth_sign, we need to sign arbitrary data:
  signMessage (address, data, opts = {}) {
    // const message = ethUtil.stripHexPrefix(data)
    // const privKey = this.getPrivateKeyFor(address, opts);
    // var msgSig = ethUtil.ecsign(new Buffer(message, 'hex'), privKey)
    // var rawMsgSig = ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s))
    // return Promise.resolve(rawMsgSig)
  }

  // For eth_sign, we need to sign transactions:
  newGethSignMessage (withAccount, msgHex, opts = {}) {
    // const privKey = this.getPrivateKeyFor(withAccount, opts);
    // const msgBuffer = ethUtil.toBuffer(msgHex)
    // const msgHash = ethUtil.hashPersonalMessage(msgBuffer)
    // const msgSig = ethUtil.ecsign(msgHash, privKey)
    // const rawMsgSig = ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s))
    // return Promise.resolve(rawMsgSig)
  }

  // For personal_sign, we need to prefix the message:
  signPersonalMessage (address, msgHex, opts = {}) {
    // const privKey = this.getPrivateKeyFor(address, opts);
    // const privKeyBuffer = new Buffer(privKey, 'hex')
    // const sig = sigUtil.personalSign(privKeyBuffer, { data: msgHex })
    // return Promise.resolve(sig)
  }

  // For eth_decryptMessage:
  decryptMessage (withAccount, encryptedData) {
    // const wallet = this._getWalletForAccount(withAccount)
    // const privKey = ethUtil.stripHexPrefix(wallet.getPrivateKey())
    // const privKeyBuffer = new Buffer(privKey, 'hex')
    // const sig = sigUtil.decrypt(encryptedData, privKey)
    // return Promise.resolve(sig)
  }

  // For eth_decryptMessage:
  decryptMessage (withAccount, encryptedData) {
    // const wallet = this._getWalletForAccount(withAccount)
    // const privKey = ethUtil.stripHexPrefix(wallet.getPrivateKey())
    // const privKeyBuffer = new Buffer(privKey, 'hex')
    // const sig = sigUtil.decrypt(encryptedData, privKey)
    // return Promise.resolve(sig)
  }

  // exportAccount should return a hex-encoded private key:
  exportAccount(address, opts = {}) {
    const wallet = this._getWalletForAddress(address, opts);
    return Promise.resolve(wallet.getSecretKeyString());
  }

  removeAccount (address) {
    if (this._getWalletForAddress(address)==null) {
      throw new Error(`Address ${address} not found in this keyring`);
    }
    Promise.resolve(this.wallets = this.wallets.filter( w => w.getAddress() !== address));
  }

  // returns an address specific to an app
  getAppKeyAddress (address, origin) {
    if (!origin || typeof origin !== 'string') {
      throw new Error(`'origin' must be a non-empty string`);
    }
    return new Promise((resolve, reject) => {
      try {
        const wallet = this._getWalletForAddress(address, {
          withAppKeyOrigin: origin,
        });
        const appKeyAddress = wallet.getAddress();
        return resolve(appKeyAddress);
      } catch (e) {
        return reject(e)
      }
    });
  }

  /* PRIVATE METHODS */
  _getWalletForAddress(address, opts = {}) {
    let wallet = this.wallets.find(w => w.getAddress() === address);
    if (!wallet) throw new Error('Simple Keyring - Unable to find matching address.');

    if (opts.withAppKeyOrigin) {
      const secretKey = wallet.getSecretKey();
      const appKeyOriginBuffer = Buffer.from(opts.withAppKeyOrigin, 'utf8');
      const appKeyBuffer = Buffer.concat([secretKey, appKeyOriginBuffer]);
      const appKeyPrivKey = createKeccakHash('keccak256').update(appKeyBuffer).digest();
      wallet = Wallet.fromPrivateKey(appKeyPrivKey);
    }

    return wallet;
  }
}

SimpleKeyring.type = type
module.exports = SimpleKeyring
