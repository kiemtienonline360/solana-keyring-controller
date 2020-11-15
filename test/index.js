const { strict: assert } = require('assert');
const sinon = require('sinon');
const Wallet = require('../solana-wallet');

const configManagerGen = require('./lib/mock-config-manager');
const mockEncryptor = require('./lib/mock-encryptor');
const KeyringController = require('..');

const mockAddress = '7dpkJCqGUd9iPT5vkAtkrpnDXoZkFLjVEzdam8NRQQ83';
let sandbox;

describe('KeyringController', function () {
  let keyringController;
  const password = 'password123';
  const seedWords = 'puzzle seed penalty soldier say clay field arctic metal hen cage runway';
  const addresses = [mockAddress];

  beforeEach(async function () {
    sandbox = sinon.createSandbox()
    window.localStorage = {} // Hacking localStorage support into JSDom

    keyringController = new KeyringController({
      configManager: configManagerGen(),
      encryptor: mockEncryptor,
    });
    await keyringController.createNewVaultAndKeychain(password);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('setLocked', function () {
    it('setLocked correctly sets lock state', async function () {
      assert.notDeepEqual(
        keyringController.keyrings, [],
        'keyrings should not be empty',
      );
      await keyringController.setLocked();
      assert.equal(
        keyringController.password, null,
        'password should be null',
      );
      assert.equal(
        keyringController.memStore.getState().isUnlocked, false,
        'isUnlocked should be false',
      );
      assert.deepEqual(
        keyringController.keyrings, [],
        'keyrings should be empty',
      );
    });

    it('emits "lock" event', async function () {
      const spy = sinon.spy();
      keyringController.on('lock', spy);
      await keyringController.setLocked();
      assert.ok(spy.calledOnce, 'lock event fired');
    });
  });

  describe('submitPassword', function () {
    it('should not create new keyrings when called in series', async function () {
      await keyringController.createNewVaultAndKeychain(password);
      await keyringController.persistAllKeyrings();
      assert.equal(keyringController.keyrings.length, 1, 'has one keyring');

      await keyringController.submitPassword(`${password}a`);
      assert.equal(keyringController.keyrings.length, 1, 'has one keyring');

      await keyringController.submitPassword('');
      assert.equal(keyringController.keyrings.length, 1, 'has one keyring');
    });

    it('emits "unlock" event', async function () {
      await keyringController.setLocked();
      const spy = sinon.spy();
      keyringController.on('unlock', spy);
      await keyringController.submitPassword(password);
      assert.ok(spy.calledOnce, 'unlock event fired');
    });
  });

  describe('createNewVaultAndKeychain', function () {
    it('should set a vault on the configManager', async function () {
      keyringController.store.updateState({ vault: null });
      assert(!keyringController.store.getState().vault, 'no previous vault');
      await keyringController.createNewVaultAndKeychain(password);
      const { vault } = keyringController.store.getState();
      assert(vault, 'vault created');
    });

    it('should encrypt keyrings with the correct password each time they are persisted', async function () {
      keyringController.store.updateState({ vault: null });
      assert(!keyringController.store.getState().vault, 'no previous vault');
      await keyringController.createNewVaultAndKeychain(password);
      const { vault } = keyringController.store.getState();
      assert(vault, 'vault created');
      keyringController.encryptor.encrypt.args.forEach(([actualPassword]) => {
        assert.equal(actualPassword, password);
      });
    });
  })

  describe('addNewKeyring', function () {
    it('Simple Key Pair', async function () {
      const secretKey = '813d9157f1ac8af47ae71753f93da1687d606b3e58152ed04fb5b385ca6f42910bc08e1c4142d6acd5557175033611a11dd86392799af75dd95c2cedb9665471';
      const previousAccounts = await keyringController.getAccounts();
      const keyring = await keyringController.addNewKeyring('Simple Key Pair', [secretKey]);
      const keyringAccounts = await keyring.getAccounts();
      const expectedKeyringAccounts = ['nsnKdDDJqJp42gdCioeUt3UuzSfYwa7Nyi4GpSyU61e'];
      assert.deepEqual(keyringAccounts, expectedKeyringAccounts, 'keyringAccounts match expectation');

      const allAccounts = await keyringController.getAccounts();
      const expectedAllAccounts = previousAccounts.concat(expectedKeyringAccounts);
      assert.deepEqual(allAccounts, expectedAllAccounts, 'allAccounts match expectation');
    })
  })

  describe('restoreKeyring', function () {
    it(`should pass a keyring's serialized data back to the correct type.`, async function () {
      const mockSerialized = {
        type: 'HD Key Tree',
        data: {
          mnemonic: seedWords,
          numberOfAccounts: 1,
        },
      };
      const keyring = await keyringController.restoreKeyring(mockSerialized);
      assert.equal(keyring.wallets.length, 1, 'one wallet restored');
      const accounts = await keyring.getAccounts();
      assert.equal(accounts[0], addresses[0]);
    });
  })

  describe('getAccounts', function () {
    it('returns the result of getAccounts for each keyring', async function () {
      keyringController.keyrings = [
        {
          getAccounts () {
            return Promise.resolve([1, 2, 3])
          },
        },
        {
          getAccounts () {
            return Promise.resolve([4, 5, 6])
          },
        },
      ];

      const result = await keyringController.getAccounts();
      assert.deepEqual(result, [1, 2, 3, 4, 5, 6]);
    });
  });

  describe('removeAccount', function () {

    it('removes an account from the corresponding keyring', async function () {
      const account = {
        secretKey: '813d9157f1ac8af47ae71753f93da1687d606b3e58152ed04fb5b385ca6f42910bc08e1c4142d6acd5557175033611a11dd86392799af75dd95c2cedb9665471',
        publicKey: 'nsnKdDDJqJp42gdCioeUt3UuzSfYwa7Nyi4GpSyU61e',
      };
      const accountsBeforeAdding = await keyringController.getAccounts();

      // Add a new keyring with one account
      await keyringController.addNewKeyring('Simple Key Pair', [account.secretKey]);

      // remove that account that we just added
      await keyringController.removeAccount(account.publicKey);

      // fetch accounts after removal
      const result = await keyringController.getAccounts();
      assert.deepEqual(result, accountsBeforeAdding);
    })

    it('removes the keyring if there are no accounts after removal', async function () {
      const account = {
        privateKey: '813d9157f1ac8af47ae71753f93da1687d606b3e58152ed04fb5b385ca6f42910bc08e1c4142d6acd5557175033611a11dd86392799af75dd95c2cedb9665471',
        publicKey: 'nsnKdDDJqJp42gdCioeUt3UuzSfYwa7Nyi4GpSyU61e',
      };

      // Add a new keyring with one account
      await keyringController.addNewKeyring('Simple Key Pair', [account.privateKey])

      // We should have 2 keyrings
      assert.equal(keyringController.keyrings.length, 2);

      // remove that account that we just added
      await keyringController.removeAccount(account.publicKey);

      // Check that the previous keyring with only one account
      // was also removed after removing the account
      assert.equal(keyringController.keyrings.length, 1);
    });
  });

  // describe('addGasBuffer', function () {
  //   it('adds 100k gas buffer to estimates', function () {
  //     const gas = '0x04ee59' // Actual estimated gas example
  //     const tooBigOutput = '0x80674f9' // Actual bad output
  //     const bnGas = new BN(ethUtil.stripHexPrefix(gas), 16)
  //     const correctBuffer = new BN('100000', 10)
  //     const correct = bnGas.add(correctBuffer)

  //     // const tooBig = new BN(tooBigOutput, 16)
  //     const result = keyringController.addGasBuffer(gas)
  //     const bnResult = new BN(ethUtil.stripHexPrefix(result), 16)

  //     assert.equal(result.indexOf('0x'), 0, 'included hex prefix')
  //     assert(bnResult.gt(bnGas), 'Estimate increased in value.')
  //     assert.equal(bnResult.sub(bnGas).toString(10), '100000', 'added 100k gas')
  //     assert.equal(result, `0x${correct.toString(16)}`, 'Added the right amount')
  //     assert.notEqual(result, tooBigOutput, 'not that bad estimate')
  //   });
  // });

  describe('unlockKeyrings', function () {
    it('returns the list of keyrings', async function () {
      await keyringController.setLocked();
      const keyrings = await keyringController.unlockKeyrings(password);
      assert.notStrictEqual(keyrings.length, 0);
      keyrings.forEach((keyring) => {
        assert.strictEqual(keyring.wallets.length, 1);
      });
    });
  });

  describe('getAppKeyAddress', function () {
    it('returns the expected app key address', async function () {
      const address = 'nsnKdDDJqJp42gdCioeUt3UuzSfYwa7Nyi4GpSyU61e';
      const secretKey = '813d9157f1ac8af47ae71753f93da1687d606b3e58152ed04fb5b385ca6f42910bc08e1c4142d6acd5557175033611a11dd86392799af75dd95c2cedb9665471';

      const keyring = await keyringController.addNewKeyring('Simple Key Pair', [secretKey]);
      keyring.getAppKeyAddress = sinon.spy();
      /* eslint-disable-next-line require-atomic-updates */
      keyringController.getKeyringForAccount = sinon.stub().returns(Promise.resolve(keyring));

      await keyringController.getAppKeyAddress(address, 'someapp.origin.io');

      assert(keyringController.getKeyringForAccount.calledOnce);
      assert.equal(keyringController.getKeyringForAccount.getCall(0).args[0], address);
      assert(keyring.getAppKeyAddress.calledOnce);
      assert.deepEqual(keyring.getAppKeyAddress.getCall(0).args, [address, 'someapp.origin.io']);
    })
  })

  describe('exportAppKeyForAddress', function () {
    it('returns a unique key', async function () {
      const address = 'nsnKdDDJqJp42gdCioeUt3UuzSfYwa7Nyi4GpSyU61e';
      const secretKey = '813d9157f1ac8af47ae71753f93da1687d606b3e58152ed04fb5b385ca6f42910bc08e1c4142d6acd5557175033611a11dd86392799af75dd95c2cedb9665471';
      await keyringController.addNewKeyring('Simple Key Pair', [secretKey]);
      
      const appKeyAddress = await keyringController.getAppKeyAddress(address, 'someapp.origin.io');
      const secretAppKey = await keyringController.exportAppKeyForAddress(address, 'someapp.origin.io');

      const wallet = Wallet.fromSecretKey(Buffer.from(secretAppKey, "hex"));
      const recoveredAddress = wallet.getAddress();

      assert.equal(recoveredAddress, appKeyAddress, 'Exported the appropriate private key');
      assert.notEqual(secretAppKey, secretKey);
    });
  });
});
