const { expect } = require("chai");

describe("Game contract", () => {
    
    let owner, playerone, playertwo;

    let greedyToken, game;
    
    before('Gets data before test cases', async () => {
        // Create Signers
        [owner, playerone, playertwo] = await ethers.getSigners();

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

    it("Can create Game", async () => {

        // Create Game
        await greedyToken.connect(playerone).approve(game.address, 5);
        await game.connect(playerone).create_game(playertwo.address, ethers.utils.formatBytes32String('test'), ethers.utils.formatBytes32String('rhino'), 5);

        const game_details = await game.connect(playerone).get_game(ethers.utils.formatBytes32String('test'));

        expect(game_details[0]).to.equal(playerone.address);
        expect(game_details[1]).to.equal(playertwo.address);
        expect(game_details[2]).to.equal(5);

    });

  
});