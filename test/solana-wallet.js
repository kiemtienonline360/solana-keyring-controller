const { strict: assert } = require('assert');
const Wallet = require('../solana-wallet');
const Web3 = require('@solana/web3.js');

function checkWallet(w) {
  assert.equal(Wallet.isValidAddress(w.getAddress()), true, "getAddress() return invalid address for Solana!");
  assert.equal(w.getAccount() instanceof Web3.Account, true, "getAccount() return a Web3.Account object!");

  assert.equal(w.getSecretKeyString().length, 128, "Secret key contains 64 elements!");

  assert.equal(w.getPublicKeyString().length, 64, "Length of publickey string is 64!");
  assert.equal(w.getPublicKey() instanceof Web3.PublicKey, true, "Public key is instance of Web3.PublicKey!");
}

describe('Solana-Wallet', function () {
  describe('generateWallet', function () {
    it('Generating wallet run normally', async function () {
      let w = Wallet.generateWallet();
      checkWallet(w);

      // console.log("Address", w.getAddress());
      // console.log("Public Key", w.getPublicKeyString());
      // console.log("Secret Key", w.getSecretKeyString());
    });

    it('Generating wallet from seed run normally', async function () {
      let info = Wallet.generateMnemonic();
      assert.equal(info.mnemonic.split(" ").length, 12, "Mnemonic must contain 12 words!");

      let w = Wallet.fromSeed(info.seed, 0, 0);
      checkWallet(w);
    });

    it('The address match with mnemonic', async function () {
      let mnemonic = "puzzle seed penalty soldier say clay field arctic metal hen cage runway";
      let seed = Wallet.mnemonicToSeed(mnemonic);
      let w = Wallet.fromSeed(seed);
      let address = w.getAddress();
      assert.equal(address, "7dpkJCqGUd9iPT5vkAtkrpnDXoZkFLjVEzdam8NRQQ83", "The address match with mnemonic");
    });
  });
});
