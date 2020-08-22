const express = require("express");
const app = express()
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const uuid = require("uuid/v1");
const port = process.argv[2];
const rp = require("request-promise") 

const nodeAddress = uuid().split('-').join('');

const bitcoin = new Blockchain();



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/blockchain',function(req,res){
   res.send(bitcoin);
})

const blockIndex = bitcoin.createNewTransaction(50,'asstubjfeie','addwiwwbbw');

app.post('/transaction',function(req,res){
   const newTransaction = req.body;
   
   const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    
    res.json({note:`Transaction will be added to block ${blockIndex}.`});      
});

app.post('/transaction/broadcast',function(req,res){
    const newTransaction = bitcoin.createNewTransaction(req.body.amount,req.body.sender,req.body.receipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);
    
    const requestPromises = [];
    bitcoin.networkNode.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        
        requestPromises.push(rp(requestOptions));
    })  
     
    Promise.all(requestPromises)
    .then(data => {
        res.json({note:'Transaction created and broadcast successfully'})
    }) 
})


app.get('/mine',function(req,res){
    const lastblock = bitcoin.getLastBlock();
    const previousBlockHash = lastblock['hash']

    const currentBlockData ={
        transactions : bitcoin.pendingTransactions,
        index:lastblock['index'] + 1
    }  
    
    const nonce = bitcoin.proofOfWork(previousBlockHash,currentBlockData);    
    const blockhash = bitcoin.hashblock(previousBlockHash,currentBlockData,nonce);
    const newBlock = bitcoin.createNewBlock(nonce,previousBlockHash,blockhash); 
    
    
    const requestPromises = [];
    
    bitcoin.networkNode.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock : newBlock } ,
            json: true
        }
        
        requestPromises.push(rp(requestOptions));
    });
    
    Promise.all(requestPromises)
    .then(data => {
        const requestOptions = {
            uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
            method: 'POST',
            body:{
                amount: 12.5,
                sender: "00",
                recipient : nodeAddress
            },
            json: true
        };
        
        return rp(requestOptions);
    })
    .then(data => {
        res.json({
            note: 'New Block mined successfully',
            block : newBlock
        })
    })
});

 
app.post('/receive-new-block',function(req,res){
    const newBlock = req.body.newBlock;
    const lastblock = bitcoin.getLastBlock();
    const correctHash = lastblock.hash === newBlock.previousBlockHash;
    const correctIndex = lastblock['index'] + 1 === newBlock['index'];

    if(correctHash && correctIndex){
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note:'New block received and accepted',
            newBlock: 'newBlock'
        });
        
    }else
    {
        res.json({
            note: 'New block rejected',
            newBlock: newBlock
        });
    }
})


//register a node and broadcast it the network
app.post('/register-and-broadcast-node',function(req,res){
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNode.indexOf(newNodeUrl) == -1) bitcoin.networkNode.push(newNodeUrl);
    
    const regNodesPromises = [];
    
    bitcoin.networkNode.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method:'POST',
            body:{newNodeUrl:newNodeUrl},
            json:true
        };
        
        regNodesPromises.push(rp(requestOptions));
    });
    
    Promise.all(regNodesPromises)
    .then(date => {
       //...
       // use the data
       
       const bulkRegisterOptions = {
           uri: newNodeUrl + '/register-nodes-bulk',
           method:'POST',
           body: { allNetworkNodes : [...bitcoin.networkNode,bitcoin.currentNodeUrl]},
           json:true
       };
       
       return rp(bulkRegisterOptions);
    })
    .then(data => {
        res.json({note:'New node registered with network successfully'})
    })
});


app.post('/register-node', function(req,res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNode.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    
    if(nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNode.push(newNodeUrl)
    res.json({note:'New node registered successfully with node'});    
})

app.post('/register-nodes-bulk',function(req,res){
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNode.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
        
        if(nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNode.push(networkNodeUrl)
    });
    
    res.json({ note:'Bulk registration successful'});  
})


app.listen(port,function(){
   console.log(`Listening on port ${port}...`); 
});
