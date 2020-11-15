'use strict';

const Web3 = require('@solana/web3.js');
const HDKeyring = require('./solana-hd-keyring');
const Wallet = require('./solana-wallet');

let url = "https://api.mainnet-beta.solana.com";
//let url = "https://testnet.solana.com";
// let url = "https://devnet.solana.com";
const connection = new Web3.Connection(url);

async function requestAirdrop(address, amount) {
  try {
    let publicKey = Wallet.toPublicKey(address);
    await connection.requestAirdrop(publicKey, amount);
    let balance = await connection.getBalance(publicKey);
    console.log(address, balance);
    return true;
  } catch(ex) {
    console.error("Request airdrop error", ex);
  }
  return false;
}

async function getRecentBlockInfo() {
  try {
    return await connection.getRecentBlockhash("max");
  } catch(ex) {
    console.error("getRecentBlockInfo error", ex);
  }
  return null;
}

async function sendTransaction(srcWallet, dstAddress, amount) {
    let transactionInstruction = Web3.SystemProgram.transfer({
      fromPubkey: srcWallet.getPublicKey(),
      toPubkey: Wallet.toPublicKey(dstAddress),
      lamports: amount,
    });
    let transaction = new Web3.Transaction();
    transaction.add(transactionInstruction);

    let signature = '';
    try {
      signature = await Web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [srcWallet.getAccount()],
        {confirmations: 1},
      );
      return true;
    } catch (err) {
      // Transaction failed but fees were still taken
      console.log("Error to send", err);
    }
    return false;
}

async function showWallet(num) {
  let mnemonic = "special current change similar vapor magic maple sort rival biology cattle advice";
  let hd = new HDKeyring({mnemonic: mnemonic});
  await hd.addAccounts(num);
  let accounts = await hd.getAccounts();
  for (let idx=0; idx<accounts.length; idx++) {
    console.log("[" + idx + "] " + accounts[idx] + " => " + await getBalance(accounts[idx]) + " SOL");
  }
}

async function checkAndUpdateWallet(num) {
  let mnemonic = "special current change similar vapor magic maple sort rival biology cattle advice";
  let hd = new HDKeyring({mnemonic: mnemonic});
  let checkedAmount = 1000000;
  let blockInfo = await getRecentBlockInfo();
  if (blockInfo==null) return false;
  let feeInLamport = blockInfo.feeCalculator.lamportsPerSignature;

  hd.addAccounts(num);
  let wallets = await hd.getWallets();
  for (let idx=1; idx<wallets.length; idx++) {
    let wallet = wallets[idx];
    let balanceInLamport = await getBalance(wallet.getAddress());
    if (balanceInLamport>checkedAmount) {
      let amount = balanceInLamport - 2*feeInLamport;
      if (await sendTransaction(wallet, wallets[0].getAddress(), amount)) {
        console.log("[" + idx + "] Send " + amount + " lamports from " + wallet.getAddress() + " to " + wallets[0].getAddress() + " => Success");
      } else {
        console.log("[" + idx + "] Send " + amount + " lamports from " + wallet.getAddress() + " to " + wallets[0].getAddress() + " => Failed");
      }
    }
  }
}

async function getBalance(address) {
  return new Promise(function(resolve, reject) {
    connection.getBalance(Wallet.toPublicKey(address)).then(balance => {
      resolve(balance);
    });
  });
}

//test1();
//requestAirdrop("Bn8urkYPh2ewh89CRQHEskBVY8q8CoatFt18f2Zmtqtv", 10000000000);  // Request 10 SOL, toi da 10 SOL
//testSendTransaction1();
// let a = Buffer.from([1 , 14, 254]);
// console.log(a.toString("hex"));
// let b = Buffer.from(a.toString("hex"), "hex");
// console.log(b);
// testAppkey();
showWallet(30);
// checkAndUpdateWallet(30);