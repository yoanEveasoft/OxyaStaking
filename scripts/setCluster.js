const hre = require("hardhat");
const { waffle, ethers } = require("hardhat");
const provider = waffle.provider;
const idsList = require("../ids");
const clustersList = require("../clusters");

require("dotenv").config();

const { PRIVATE_KEY } = process.env;

async function connect() {
  let wallet = await new ethers.Wallet(PRIVATE_KEY); //mainnet
  //let wallet = (await ethers.getSigners())[0]; //local

  console.log(
    "Init  Balance",
    (await provider.getBalance(wallet.address)).toString()
  );

  console.log("wallet address:", wallet.address);
  console.log("------------------");

  return wallet;
}

async function writeCluster() {

  const wallet = await connect();


  const testStaking = await hre.ethers.getContractAt("testStaking", "0xD9213e74f53905462f40FA8cC65f272263bcEd1F");
 /*  const estimation = await  testStaking.estimateGas.setCluster(
    1223,
    2
  ); */

  for (let i = 1250; i < idsList.length; i++) {
    const clusterId = clustersList[i];
    const tokenId = idsList[i];
    
    const prevClusterId = await (await testStaking.NFTcluster(tokenId)).toString();

    //check if already written to save gas
    if (prevClusterId !== clusterId.toString())
      await testStaking.setCluster(
        tokenId,
        clusterId
      );

    console.log(`✓ Setting clusterId ${clusterId} for tokenId=${tokenId}`);
  }
  
}

writeCluster()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
