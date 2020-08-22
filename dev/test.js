const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

const previousBlockHash = 'sumitkumar123';

const currentBlockData = [
 {
  amount:12,
  sender:'asstubjfeie',
  recipient:'addwiwwbbw'
 }, 
 {
  amount:14,
  sender:'qwqqiuiwhiuefhie',
  receipient:'23w2edegvqefaqg'
 },
 {
  amount:237,
  sender: 'kflfnqnkfjfwwfqfqa',
  receipient:'kndnlonqdlQNDQBKD'
 }
]

console.log(bitcoin.proofOfWork(previousBlockHash,currentBlockData));
//console.log(bitcoin.hashblock(previousBlockHash,currentBlockData,148610));