const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Game contract", () => {
    
    let owner, playerone, playertwo, playerthree;

    let greedyToken, game;
    
    before('Gets data before test cases', async () => {
        // Create Signers
        [owner, playerone, playertwo, playerthree] = await ethers.getSigners();

        // Deploy Tokens
        const Token = await ethers.getContractFactory("GreedyToken");
        greedyToken = await Token.deploy("Greedy", "GRE");

        // Transfer 100 tokens from owner to playerone
        await greedyToken.transfer(playerone.address, 100);

        // Transfer 50 tokens from playertwo to playertwo
        await greedyToken.connect(playerone).transfer(playertwo.address, 50);

        // Deploy Game Contract
        const gameFactory = await ethers.getContractFactory("RockPaperScissors");
        game = await gameFactory.deploy(greedyToken.address);
        
    })

    it("Can create Game with Valid Move", async () => {

        // Create Game
        await greedyToken.connect(playerone).approve(game.address, 5);
        await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test'), ethers.utils.formatBytes32String('rhino'), 5);

        const game_details = await game.connect(playerone).get_game(ethers.utils.formatBytes32String('test'));

        expect(game_details[0]).to.equal(playerone.address);
        expect(game_details[1]).to.equal(playertwo.address);
        expect(game_details[2]).to.equal(5);

    });

    it("Cannot create Game with same name", async () => {

        // Create Game again 
        await greedyToken.connect(playerone).approve(game.address, 5);
        try {
            await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test'), ethers.utils.formatBytes32String('rhino'), 5);

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){
            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Sorry game name has been taken, game Name must be unique'");
        }
            

    });

    
    it("Invalid Move Used", async () => {

        // With no r p or s
        try {
            await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test_one'), ethers.utils.formatBytes32String('a'), 5);

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){
            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Cannot use the words Rock, Paper, or Scissors, To increase Smart Contract Spying for easy Wins. Use a word that contains only R's, or only P's or only S's (any case)'");
        }

        // With no r p or s
        try {
            await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test_one'), ethers.utils.formatBytes32String('rps'), 5);

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){
            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Cannot use the words Rock, Paper, or Scissors, To increase Smart Contract Spying for easy Wins. Use a word that contains only R's, or only P's or only S's (any case)'");
        }

        // Blank Word
        try {
            await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test_one'), ethers.utils.formatBytes32String(''), 5);

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){
            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Cannot use the words Rock, Paper, or Scissors, To increase Smart Contract Spying for easy Wins. Use a word that contains only R's, or only P's or only S's (any case)'");
        }
    });

    it("Cannot create Game with not enough funds without any winnings", async () => {

        // Create Game again 
        await greedyToken.connect(playerone).approve(game.address, 5);
        try {
            // Only approved 5 so far
            await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test_one'), ethers.utils.formatBytes32String('s'), 10);

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){
            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'");
        }

    });

    it("Add invalid move to valid Game", async () => {

        // Create Game again 
        await greedyToken.connect(playertwo).approve(game.address, 5);
        try {
            // Only approved 5 so far
            await game.connect(playertwo).add_move(ethers.utils.formatBytes32String('test'), ethers.utils.formatBytes32String(''));
            
            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){
            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Cannot use the words Rock, Paper, or Scissors, To increase Smart Contract Spying for easy Wins. Use a word that contains one of the follwoing only R's, or only P's or only S's (any case)'");
        }

    });

    it("Add invalid move to valid Game", async () => {

        // Create Game again 
        await greedyToken.connect(playertwo).approve(game.address, 0);
        try {
            // Only approved 5 so far
            await game.connect(playertwo).add_move(ethers.utils.formatBytes32String('test'), ethers.utils.formatBytes32String('s'));
            
            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){
            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds allowance'");
        }

    });

    it("Add move to valid Game", async () => {

        // Create Game again 
        await greedyToken.connect(playertwo).approve(game.address, 5);
        try {
            // Only approved 5 so far
            await game.connect(playertwo).add_move(ethers.utils.formatBytes32String('test'), ethers.utils.formatBytes32String('s'));
            
        }catch(err){

            
            assert.fail(0, 1, 'Exception not thrown');
        }

    });

    it("Add move to valid Game again", async () => {

        // Create Game again 
        await greedyToken.connect(playertwo).approve(game.address, 5);
        try {
            // Only approved 5 so far
            await game.connect(playertwo).add_move(ethers.utils.formatBytes32String('test'), ethers.utils.formatBytes32String('s'));

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){
            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Cannot change move once set'");
        }

    });

    it("Add move to non-existant Game", async () => {

        // Create Game again 
        await greedyToken.connect(playertwo).approve(game.address, 5);
        try {
            // Only approved 5 so far
            await game.connect(playertwo).add_move(ethers.utils.formatBytes32String('test_one'), ethers.utils.formatBytes32String('s'));

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){

            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Game referenced does not exist'");

        }

    });

    it("Add move as player one to a Game", async () => {

        // Create Game again 
        await greedyToken.connect(playerone).approve(game.address, 5);
        try {
            // Only approved 5 so far
            await game.connect(playerone).add_move(ethers.utils.formatBytes32String('test'), ethers.utils.formatBytes32String('s'));

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){

            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Only the second player can add a move to the game'");

        }

    });

    it("Reveal Move on game that does not exist", async () => {

        try {
            await game.connect(playerone).reveal_move(ethers.utils.formatBytes32String('test_one'), ethers.utils.formatBytes32String('rhino'));

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){

            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Game referenced does not exist'");

        }

    });

    it("Reveal Move on game with player not in the game", async () => {

        try {
            await game.connect(playerthree).reveal_move(ethers.utils.formatBytes32String('test'), ethers.utils.formatBytes32String('rhino'));

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){

            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Must be one of the two players'");

        }

    });

    it("Reveal Move on game where playertwo has not had a go", async () => {

        await greedyToken.connect(playerone).approve(game.address, 5);
        await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test_two'), ethers.utils.formatBytes32String('rhino'), 5);

        try {

            await game.connect(playerone).reveal_move(ethers.utils.formatBytes32String('test_two'), ethers.utils.formatBytes32String('rhino'));

            assert.fail(0, 1, 'Exception not thrown');
            
        }catch(err){

            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Must allow player two to make a move'");

        }

    });

    it("Reveal Both Moves on game where playerone and playertwo have placed", async () => {

        await greedyToken.connect(playerone).approve(game.address, 5);
        await greedyToken.connect(playertwo).approve(game.address, 5);

        await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test_three'), ethers.utils.formatBytes32String('rhino'), 5);
        await game.connect(playertwo).add_move(ethers.utils.formatBytes32String('test_three'), ethers.utils.formatBytes32String('s'));

        try {
            
            await game.connect(playerone).reveal_move(ethers.utils.formatBytes32String('test_three'), ethers.utils.formatBytes32String('rhino'));
            await game.connect(playertwo).reveal_move(ethers.utils.formatBytes32String('test_three'), ethers.utils.formatBytes32String('s'));

        }catch(err){
            assert.fail(0, 1, 'Exception not thrown');

        }

    });


    it("Claim winnings for game that does not exist", async () => {

        try {
            
            await game.connect(playerone).claim_winnings(ethers.utils.formatBytes32String('test_four'), false);

            assert.fail(0, 1, 'Exception not thrown');

        }catch(err){           

            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Game referenced does not exist'");

        }

    });

    it("Claim winnings with loser", async () => {

        try {
            
            await game.connect(playertwo).claim_winnings(ethers.utils.formatBytes32String('test_three'), false);

            assert.fail(0, 1, 'Exception not thrown');

        }catch(err){           

            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Only winner can claim, or time out for a player who has revealed'");

        }

    });

    it("Claim winnings with winner with no transfer out", async () => {

        try {
            const pre_winnings = await game.connect(playerone).get_winnings();

            expect(pre_winnings).to.equal(0);

            await game.connect(playerone).claim_winnings(ethers.utils.formatBytes32String('test_three'), false);

            const post_winnings = await game.connect(playerone).get_winnings();

            expect(post_winnings).to.equal(10);

        }catch(err){           
            console.log(err.message)
            assert.fail(0, 1, 'Exception not thrown');

        }

    });

    it("Transfer stored winnings", async () => {

        try {
            const post_winnings = await game.connect(playerone).get_winnings();
            expect(post_winnings).to.equal("10");

            await game.connect(playerone).withdraw_winnings();
            const post_with = await game.connect(playerone).get_winnings();
            expect(post_with).to.equal(0);

            expect(await greedyToken.balanceOf(playerone.address)).to.equal(45);

        }catch(err){           
            assert.fail(0, 1, 'Exception not thrown');

        }

    });

    it("Claim winnings with winner with transfer out", async () => {

        await greedyToken.connect(playerone).approve(game.address, 10);
        await greedyToken.connect(playertwo).approve(game.address, 10);

        await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test_transfer'), ethers.utils.formatBytes32String('s'), 10);
        await game.connect(playertwo).add_move(ethers.utils.formatBytes32String('test_transfer'), ethers.utils.formatBytes32String('p'));

        await game.connect(playerone).reveal_move(ethers.utils.formatBytes32String('test_transfer'), ethers.utils.formatBytes32String('s'));
        await game.connect(playertwo).reveal_move(ethers.utils.formatBytes32String('test_transfer'), ethers.utils.formatBytes32String('p'));

        await game.connect(playerone).claim_winnings(ethers.utils.formatBytes32String('test_transfer'), true);

        expect(await greedyToken.balanceOf(playerone.address)).to.equal(55);

    });

  
});