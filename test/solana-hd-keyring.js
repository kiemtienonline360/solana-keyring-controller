const { strict: assert } = require('assert');
const HDKeyring = require('../solana-hd-keyring');
const Wallet = require('../solana-wallet');
const Web3 = require('@solana/web3.js');
const { deserialize } = require('v8');

function checkAddresses(addresses, checkLength) {
  assert.equal(addresses.length, checkLength, "addAccount() must return array with invalid length");
  for (let idx=0; idx<addresses.length; idx++) {
    assert.equal(Wallet.isValidAddress(addresses[idx]), true, "The address is invalid!");
  }
}

describe('Solana-HD-Keyring', function () {
  describe('HDKeyring runs normally', function () {
    it('addAccounts() runs normally', async function () {
      let sk = new HDKeyring();
      let acc1 = await sk.addAccounts(3);
      checkAddresses(acc1, 3);

      let acc2 = await sk.addAccounts(2);
      checkAddresses(acc2, 2);

      let acc = await sk.getAccounts();
      checkAddresses(acc, 5);
    });
    
    it('exportAccount() runs normally', async function () {
      let sk = new HDKeyring();
      let acc = await sk.addAccounts(3);
      let address = acc[0];

      let secryptKeyString = await sk.exportAccount(address);
      assert.equal(secryptKeyString.length, 128, "Length of secretkey string is 64!");

      let msg = "";
      address = "6s8Yw3pFA7zVQvriZMe1sF8uyBWN8VJq5kc3pAmYcEU2";
      try {
        secryptKeyString = await sk.exportAccount(address);
      } catch (ex) {
        msg = ex.toString();
      }
      assert.equal(msg.includes("Unable to find matching address"), true, "exportAccount() raise an exception if the address is not in the list");
    });

    it('removeAccount() runs normally', async function () {
      let sk = new HDKeyring();
      let acc = await sk.addAccounts(3);
      let address = acc[0];

      await sk.removeAccount(address);
      acc = await sk.getAccounts();
      assert.equal(acc.includes(address), false, "The removed address is not in the list!");

      let msg = "";
      address = "6s8Yw3pFA7zVQvriZMe1sF8uyBWN8VJq5kc3pAmYcEU2";
      try {
        await sk.removeAccount(address);
      } catch (ex) {
        msg = ex.toString();
      }
      assert.equal(msg.includes("Unable to find matching address"), true, "removeAccount() raise an exception if the address is not in the list");
    });

    it('serialize() and deserialize() run normally', async function () {
      let sk1 = new HDKeyring();
      await sk1.addAccounts(3);
      let acc1 = await sk1.getAccounts();
      
      let secretKeys = sk1.serialize();
      let sk2 = new HDKeyring();
      await sk2.deserialize(secretKeys);
      let acc2 = await sk2.getAccounts();
      assert.equal(acc1.length, acc2.length, "The length must be same!");
      for (let idx=0; idx<acc1.length; idx++) {
        assert.equal(Wallet.isValidAddress(acc1[idx]) && acc1[idx]==acc2[idx], true, "The addresses are same!");
      }
    });
  });
});
