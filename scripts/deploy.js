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

async function deploy() {
/*  const TestERC721Token = await hre.ethers.getContractFactory("OxyaNFT");
  const testERC721Token = await TestERC721Token.deploy();

  await testERC721Token.deployed(); */

  const TestStaking = await hre.ethers.getContractFactory("OxyaStaking");
  const testStaking = await TestStaking.deploy(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );

  //await testStaking.deployed();

  //console.log("✓ OxyaNFT deployed to:", testERC721Token.address);
  console.log("✓ OxyaStaking deployed to:", testStaking.address);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
