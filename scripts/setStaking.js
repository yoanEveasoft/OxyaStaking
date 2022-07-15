const hre = require("hardhat");
const { waffle, ethers } = require("hardhat");
const provider = waffle.provider;

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

async function MintAndStake() {
  const wallet = await connect();

  const testMint = await hre.ethers.getContractAt(
    "TestNFT",
    "0xD09dC19DE3b72379FA140A257c83d78bf9f2190f"
  );
  const testStaking = await hre.ethers.getContractAt(
    "testStaking",
    "0xD9213e74f53905462f40FA8cC65f272263bcEd1F"
  );

  await testMint.setIsActive(true);
  console.log("mint contract activated");
  for (let i = 0; i < 78; i++) {
    await testMint.mintNFT(100, {
      value: ethers.utils.parseEther("0.0003"),
    });
  }
  console.log("minted");
  console.log("------------------");

  //await testStaking.toggleActive();
  console.log("staking contract activated");
  console.log("------------------");
  await testMint.approve(testStaking.address, 10);
  await testMint.setApprovalForAll(testStaking.address, true);

  for (let i = 1588; i < 6199; i++) {
    await testStaking.stake(i);
  }

  //await testStaking.batchUnstake([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
}

MintAndStake()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
