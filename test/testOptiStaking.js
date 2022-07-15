const { expect, assert } = require("chai");
const { waffle, ethers, web3 } = require("hardhat");
const provider = waffle.provider


describe("", function () {
  tokenContract = null;
  stakingContract = null;

  beforeEach(async function () {
    [owner, ...accounts] = await ethers.getSigners();
    myAddress = accounts[0].address;

    const TokenContract = await ethers.getContractFactory("ERC721Token");
    tokenContract = await TokenContract.deploy();
    await tokenContract.deployed();

    const StakingContract = await ethers.getContractFactory("OxyaStaking");
    stakingContract = await StakingContract.deploy(tokenContract.address);
    await stakingContract.deployed();
  });

  it("Should mint NFT", async function () {
    await tokenContract.toggleActive();
    await tokenContract.togglePublicSale();
    await tokenContract.connect(accounts[0]).mintNFT(1, {
      value: ethers.utils.parseEther("0.2"),
    });

    expect(await tokenContract.ownerOf(0)).to.equal(accounts[0].address);
  });

  it("Should be able to transfer", async function () {
    await tokenContract.toggleActive();
    await tokenContract.togglePublicSale();
    await tokenContract.connect(accounts[0]).mintNFT(1, {
      value: ethers.utils.parseEther("0.2"),
    });

    await tokenContract
      .connect(accounts[0])
      .transferFrom(accounts[0].address, accounts[1].address, 0);
  });

  it("Shouldn't stake if not active", async function () {
    await tokenContract.toggleActive();
    await tokenContract.togglePublicSale();
    await tokenContract.connect(accounts[0]).mintNFT(1, {
      value: ethers.utils.parseEther("0.2"),
    });

    try {
      await stakingContract.connect(accounts[0]).batchStake([0]);
    } catch (e) {}
  });

  it("Should stake NFT", async function () {
    await tokenContract.toggleActive();
    await tokenContract.togglePublicSale();
    await tokenContract.connect(accounts[0]).mintNFT(2, {
      value: ethers.utils.parseEther("0.2"),
    });
    await stakingContract.toggleActive();
    await tokenContract
      .connect(accounts[0])
      .setApprovalForAll(stakingContract.address, true);

    await stakingContract.connect(accounts[0]).batchStake([0]);
    await stakingContract.connect(accounts[0]).batchStake([1]);

    const stakeEvents = await getStakeEvents(stakingContract);

    console.log("stake events", stakeEvents);
  });

  it("Should batch stake NFT", async function () {
    await tokenContract.toggleActive();
    await tokenContract.togglePublicSale();
    await tokenContract.connect(accounts[0]).mintNFT(10, {
      value: ethers.utils.parseEther("0.2"),
    });
    await stakingContract.toggleActive();
    await tokenContract
      .connect(accounts[0])
      .setApprovalForAll(stakingContract.address, true);

      console.log(
        "gas staking with batch function",
        await stakingContract.connect(accounts[0]).estimateGas.batchStake([0,1,2])
      );

      await stakingContract.connect(accounts[0]).batchStake([0,1,2])

      expect(await tokenContract.ownerOf(0)).to.equal(stakingContract.address);
      expect(await tokenContract.ownerOf(1)).to.equal(stakingContract.address);
      expect(await tokenContract.ownerOf(2)).to.equal(stakingContract.address);
  });


  it("Should be able to batchUnstake several NFTs", async function () {
    
    //activations
    await tokenContract.toggleActive();
    await tokenContract.togglePublicSale();
    await stakingContract.toggleActive();

    //mint
    await tokenContract.connect(accounts[0]).mintNFT(10, {
      value: ethers.utils.parseEther("0.2"),
    });

    //approveforAll
    await tokenContract
      .connect(accounts[0])
      .setApprovalForAll(stakingContract.address, true);

    //batchStake
    console.log(
      "gas batchstaking ",
      await stakingContract
        .connect(accounts[0])
        .estimateGas.batchStake([0])
    );
    await stakingContract.connect(accounts[0]).batchStake([0, 1]);

    await stakingContract.toggleActive();

    //unstake
    console.log(
      "gas unstaking with several staked",
      await stakingContract.connect(accounts[0]).estimateGas.batchUnstake([0])
    );
    await stakingContract.connect(accounts[0]).batchUnstake([0]);
    
    const unstakeEvents = await getUnstakeEvents(stakingContract);

    console.log("unstake events", unstakeEvents);
  });
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getStakeEvents(stakingContract) {
  const filterFrom = stakingContract.filters.Staked();

  return (await stakingContract.queryFilter(filterFrom, -10000)).map((e) => {
    return {
      owner: e.args.owner,
      tokenId: e.args.tokenId.toString(),
      timeframe: e.args.timeframe.toString(),
    };
  });
}

async function getUnstakeEvents(stakingContract) {
  const filterFrom = stakingContract.filters.Unstaked();

  return (await stakingContract.queryFilter(filterFrom, -10000)).map((e) => {
    return {
      owner: e.args.owner,
      tokenId: e.args.tokenId.toString(),
      timeframe: e.args.timeframe.toString(),
    };
  });
}
