# Eth Keyring Controller [![CircleCI](https://circleci.com/gh/MetaMask/KeyringController.svg?style=svg)](https://circleci.com/gh/MetaMask/KeyringController)

A module for managing groups of Ethereum accounts called "Keyrings", defined originally for MetaMask's multiple-account-type feature.

To add new account types to a `KeyringController`, just make sure it follows [The Keyring Class Protocol](./docs/keyring.md).

The KeyringController has three main responsibilities:
- Initializing & using (signing with) groups of Ethereum accounts ("keyrings").
- Keeping track of local nicknames for those individual accounts.
- Providing password-encryption persisting & restoring of secret information.

## Installation

`npm install eth-keyring-controller --save`

## Usage

```javascript
const KeyringController = require('eth-keyring-controller')
const SimpleKeyring = require('eth-simple-keyring')

const keyringController = new KeyringController({
  keyringTypes: [SimpleKeyring], // optional array of types to support.
  initState: initState.KeyringController, // Last emitted persisted state.
  encryptor: { // An optional object for defining encryption schemes:
               // Defaults to Browser-native SubtleCrypto.
    encrypt (password, object) {
      return new Promise('encrypted!')
    },
    decrypt (password, encryptedString) {
      return new Promise({ foo: 'bar' })
    },
  },
})

// The KeyringController is also an event emitter:
this.keyringController.on('newAccount', (address) => {
  console.log(`New account created: ${address}`)
})
this.keyringController.on('removedAccount', handleThat)
```

## Methods

## The Keyring Class Protocol

One of the goals of this class is to allow developers to easily add new signing strategies to MetaMask. We call these signing strategies Keyrings, because they can manage multiple keys.

### Keyring.type

A class property that returns a unique string describing the Keyring.
This is the only class property or method, the remaining methods are instance methods.

### constructor( options )

As a Javascript class, your Keyring object will be used to instantiate new Keyring instances using the new keyword.  For example:

```
const keyring = new YourKeyringClass(options);
```

The constructor currently receives an options object that will be defined by your keyring-building UI, once the user has gone through the steps required for you to fully instantiate a new keyring.  For example, choosing a pattern for a vanity account, or entering a seed phrase.

We haven't defined the protocol for this account-generating UI yet, so for now please ensure your Keyring behaves nicely when not passed any options object.

## Keyring Instance Methods

All below instance methods must return Promises to allow asynchronous resolution.

### serialize()

In this method, you must return any JSON-serializable JavaScript object that you like. It will be encoded to a string, encrypted with the user's password, and stored to disk. This is the same object you will receive in the deserialize() method, so it should capture all the information you need to restore the Keyring's state.

### deserialize( object )

As discussed above, the deserialize() method will be passed the JavaScript object that you returned when the serialize() method was called.

### addAccounts( n = 1 )

The addAccounts(n) method is used to inform your keyring that the user wishes to create a new account. You should perform whatever internal steps are needed so that a call to serialize() will persist the new account, and then return an array of the new account addresses.

The method may be called with or without an argument, specifying the number of accounts to create. You should generally default to 1 per call.

### getAccounts()

When this method is called, you must return an array of hex-string addresses for the accounts that your Keyring is able to sign for.

### signTransaction(address, transaction)

This method will receive a hex-prefixed, all-lowercase address string for the account you should sign the incoming transaction with.

For your convenience, the transaction is an instance of ethereumjs-tx, (https://github.com/ethereumjs/ethereumjs-tx) so signing can be as simple as:

```
transaction.sign(privateKey)
```

You must return a valid signed ethereumjs-tx (https://github.com/ethereumjs/ethereumjs-tx) object when complete, it can be the same transaction you received.

### signMessage(address, data)

The `eth_sign` method will receive the incoming data, alread hashed, and must sign that hash, and then return the raw signed hash.

### exportAccount(address)

Exports the specified account as a private key hex string.


