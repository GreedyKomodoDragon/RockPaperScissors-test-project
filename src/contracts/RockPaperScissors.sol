// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GreedyToken.sol";
import "hardhat/console.sol";

contract RockPaperScissors {

    struct Game {
        address playerOne;
        address playerTwo;
        uint entryFee;
        bytes32 moveOneSecret; // To obsecure to some extent
        bytes32 moveTwoSecret; // To obsecure to some extent 
        uint timestamp; // To stop loser from with holding their move to lock tokens in
        uint8 moveOne; 
        uint8 moveTwo; 
        bool complete; 
    }

    // Give Games Names for better User Experience (could be moved off chain to a DB to get a uint ID instead)
    mapping(bytes32 => Game) games_created;

    mapping(address => uint) winnings;

    // Token Contract for transfering tokens
    GreedyToken greedy_contract;

    constructor (address _greedy_address) {
        greedy_contract = GreedyToken(_greedy_address);
    }

    // Events
    event game_created(bytes32 name, address one, address two);
    event added_move(bytes32 name, address one);
    event move_revealed(bytes32 name, address one, uint8 move);
    event winnings_moved_to_store(address one, uint amount);
    event winnings_moved_to_address(address one, uint amount);


    function get_winnings() view public returns (uint){
        return winnings[msg.sender];
    }


    function create_game(address _playerTwo, bytes32 _name, bytes32 _move, uint _entryFee) public {
        require(games_created[_name].playerOne == address(0x0), "Sorry game name has been taken, game Name must be unique");
        require(validWordUsed(_move), "Cannot use the words Rock, Paper, or Scissors, To increase Smart Contract Spying for easy Wins. Use a word that contains only R's, or only P's or only S's (any case)");
        require((move_winnings(_entryFee) || greedy_contract.transferFrom(msg.sender, address(this), _entryFee)), "Token fee failed");

        games_created[_name] = Game({
            playerOne: msg.sender, 
            playerTwo: _playerTwo,
            entryFee: _entryFee,
            moveOneSecret: keccak256(abi.encodePacked(_move, msg.sender)),
            moveTwoSecret: "",
            timestamp: block.timestamp,
            moveOne: 0,
            moveTwo: 0,
            complete: false
        });

        emit game_created(_name, msg.sender, _playerTwo);
    }

    function get_game(bytes32 _name) view public returns (address, address, uint) {
        require(games_created[_name].playerOne != address(0x0), "Game does not exist");

        return (games_created[_name].playerOne, games_created[_name].playerTwo, games_created[_name].entryFee);
    }

    function reveal_move(bytes32 _name, bytes32 _move) public {
        require(games_created[_name].playerOne != address(0x0), "Game referenced does not exist");
        require(games_created[_name].complete == false, "Game must not already be claimed");
        require(games_created[_name].playerOne == msg.sender || games_created[_name].playerTwo == msg.sender, "Must be one of the two players");
        require(games_created[_name].moveTwoSecret != "", "Must allow player two to make a move");
        require(move_not_already_placed(_name), "Cannot reveal move again");

        if (games_created[_name].playerOne == msg.sender && keccak256(abi.encodePacked(_move, msg.sender)) == games_created[_name].moveOneSecret) {

            games_created[_name].moveOne = convert_to_byte(_move);
             emit move_revealed(_name, msg.sender, games_created[_name].moveOne);
            

        } else if (games_created[_name].playerTwo == msg.sender && keccak256(abi.encodePacked(_move, msg.sender))  == games_created[_name].moveTwoSecret) {
            
            games_created[_name].moveTwo = convert_to_byte(_move);
             emit move_revealed(_name, msg.sender, games_created[_name].moveTwo);

        } else {

            revert("unexpected error occurred");
        }

    }

    function move_not_already_placed(bytes32 _name) internal view returns (bool) {

        if (msg.sender == games_created[_name].playerOne) {
            return (games_created[_name].moveOne  == 0);
        }

        return (games_created[_name].moveTwo  == 0);
    }

    function convert_to_byte(bytes32 _move) internal pure returns (uint8) {

        for (uint i = 0; i < _move.length; i++){
            if (_move[i] == "r" || _move[i] == "R"){
                return 1;

            } else if (_move[i] == "s" || _move[i] == "S"){
                return 2;

            } else if (_move[i] == "p" || _move[i] == "P"){
                return 3;
            }
        }

        revert('Unexpected error');


    }

    function add_move(bytes32 _name, bytes32 _move) public {
        require(games_created[_name].playerOne != address(0x0), "Game referenced does not exist");
        require(games_created[_name].playerTwo == msg.sender, "Only the second player can add a move to the game");
        require(games_created[_name].moveTwoSecret == "", "Cannot change move once set");
        require(games_created[_name].complete == false, "Game must not already be claimed");
        require(validWordUsed(_move), "Cannot use the words Rock, Paper, or Scissors, To increase Smart Contract Spying for easy Wins. Use a word that contains one of the follwoing only R's, or only P's or only S's (any case)");
        require(move_winnings(games_created[_name].entryFee) || greedy_contract.transferFrom(msg.sender, address(this), games_created[_name].entryFee), "Token fee failed");

        games_created[_name].moveTwoSecret = keccak256(abi.encodePacked(_move, msg.sender));

        emit added_move(_name, msg.sender);

    }

    function validWordUsed(bytes32 _move) pure internal returns (bool) {

        bool found_r = false;
        bool found_p = false;
        bool found_s = false;

        // Look for r, s or p
        for (uint i = 0; i < _move.length; i++){
            if (_move[i] == "r" || _move[i] == "R"){
                found_r = true;

            } else if (_move[i] == "s" || _move[i] == "S"){
                found_s = true;

            } else if (_move[i] == "p" || _move[i] == "P"){
                found_p = true;

            }
        }

        // only contains one of the r s p 
        return ((found_r || found_s || found_p) && !((found_r && found_p)|| (found_r && found_s) || (found_p && found_s)));

    }

    function claim_winnings(bytes32 _name, bool _transferred_out) public {
        require(games_created[_name].playerOne != address(0x0), "Game referenced does not exist");
        require(games_created[_name].complete == false, "Game must not already be claimed");
        require(((games_created[_name].moveOne != 0 && games_created[_name].moveTwo != 0 ) && has_won_or_drawn(_name)) || timeout_fault(_name), "Only winner can claim, or time out for a player who has revealed");
        
        // Mark game as claimed
        games_created[_name].complete = true;

        if (games_created[_name].moveOne == games_created[_name].moveTwo){
            
            // if drawn return money back to the other player
            if (msg.sender == games_created[_name].playerOne){
                winnings[games_created[_name].playerTwo] = games_created[_name].entryFee;
                emit winnings_moved_to_store(games_created[_name].playerTwo, games_created[_name].entryFee);
            } else {
                winnings[games_created[_name].playerOne] = games_created[_name].entryFee;
                emit winnings_moved_to_store(games_created[_name].playerOne, games_created[_name].entryFee);
            }
           
            // Handle own tokens
            if (_transferred_out) {
                greedy_contract.approve(address(this), games_created[_name].entryFee);
                greedy_contract.transferFrom(address(this), msg.sender, games_created[_name].entryFee);

                emit winnings_moved_to_address(games_created[_name].playerOne, games_created[_name].entryFee);
            } else {

                winnings[msg.sender] = games_created[_name].entryFee;
                emit winnings_moved_to_store(games_created[_name].playerOne, games_created[_name].entryFee);
            }

        
        } else {
            // Handle own winning tokens
            if (_transferred_out) {
                greedy_contract.approve(address(this), games_created[_name].entryFee * 2);
                greedy_contract.transferFrom(address(this), msg.sender, games_created[_name].entryFee * 2);
                emit winnings_moved_to_address(games_created[_name].playerOne, games_created[_name].entryFee * 2);
            } else {
                winnings[msg.sender] = games_created[_name].entryFee * 2;
                emit winnings_moved_to_store(games_created[_name].playerOne, games_created[_name].entryFee);
            }
        }

        

    }

    function timeout_fault(bytes32 _name) view internal returns (bool) {

        // Check if game has timed out
        if (games_created[_name].timestamp + 30 < block.timestamp) {

            // player two has ignored the game -> player one should get tokens back
            if (games_created[_name].moveTwoSecret == "" && msg.sender == games_created[_name].playerOne) {
                return true;
            }
            
            if (msg.sender == games_created[_name].playerOne) {

                // player one must have revealed their before redeeming
                return games_created[_name].moveOne != 0;

            } else {
                
                // player two must have revealed their before redeeming
                return games_created[_name].moveTwo != 0;

            }
        }

        // Game still in play
        return false;

    }

    function move_winnings(uint _fee) internal returns (bool) {

        // Check if have winnings and move if possible
        if (winnings[msg.sender] >= _fee) {
            winnings[msg.sender] = winnings[msg.sender] - _fee;

            return true;
        }

        // has not enough winnings to pay fee
        return false;

    }

    function has_won_or_drawn(bytes32 _name) view internal returns (bool){

        // Check for a draw
        if (games_created[_name].moveOne == games_created[_name].moveTwo){
            return true;
        }

        /*
        byte to move:
        - 1 is Rock
        - 2 is scissors
        - 3 is paper
        */
        //Rock and Scissors - Player One
        if (games_created[_name].moveOne ==  1 && games_created[_name].moveTwo == 2 && msg.sender == games_created[_name].playerOne){
            return true;
        }

        //Rock and Scissors - Player two
        if (games_created[_name].moveOne ==  2 && games_created[_name].moveTwo == 1 && msg.sender == games_created[_name].playerTwo){
            return true;
        }


        //Paper and Scissors - Player one
        if (games_created[_name].moveOne ==  2 && games_created[_name].moveTwo == 3 && msg.sender == games_created[_name].playerOne){
            
            return true;
        }

        //Paper and Scissors - Player two
        if (games_created[_name].moveOne ==  3 && games_created[_name].moveTwo == 2 && msg.sender == games_created[_name].playerTwo){
            
            return true;
        }

        //Paper and Rock - Player one
        if (games_created[_name].moveOne ==  3 && games_created[_name].moveTwo == 1 && msg.sender == games_created[_name].playerOne){
            
            return true;
        }

        //Paper and Rock - Player two
        if (games_created[_name].moveOne ==  1 && games_created[_name].moveTwo == 3 && msg.sender == games_created[_name].playerTwo){
            
            return true;
        }

        // Did not win
        return false;

    }


    function withdraw_winnings() public {
        require(winnings[msg.sender] != 0, "Have not winnings to withdraw");

        greedy_contract.approve(address(this), winnings[msg.sender]);
        greedy_contract.transferFrom(address(this), msg.sender, winnings[msg.sender]);

        uint amount_sent = winnings[msg.sender];

        winnings[msg.sender] = 0;

        emit winnings_moved_to_address(msg.sender, amount_sent);

    }

}

