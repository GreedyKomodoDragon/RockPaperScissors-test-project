const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner, playerone] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("GreedyToken");

    const greedyToken = await Token.deploy("Greedy", "GRE");

    const ownerBalance = await greedyToken.balanceOf(owner.address);
    expect(await greedyToken.totalSupply()).to.equal(ownerBalance);
  });

  it("Owner can transfer funds to another", async function () {
    const [owner, playerone] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("GreedyToken");

    const greedyToken = await Token.deploy("Greedy", "GRE");

    // Transfer 50 tokens from owner to playerone
    await greedyToken.transfer(playerone.address, 50);

    expect(await greedyToken.balanceOf(playerone.address)).to.equal(50);

  });

  
});