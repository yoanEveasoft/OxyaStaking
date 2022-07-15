// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";

contract ERC721Token is ERC721A, Ownable {
    constructor() ERC721A("ERC721Token", "ERC721Token") {}

    string public _contractBaseURI;
    uint256 public constant MAX_NFT_PUBLIC = 100;
    uint256 public NFTPrice = 2000000000000000; // 0.002 ETH;
    uint256 public maxPerWalletPresale = 3;
    uint256 public maxPerTransaction = 20;
    uint256 private devSup = 2 ether;
    bool public isActive;
    bool public isPresaleActive;
    bool public isPublicSaleActive;
    bool public isFreeMintActive;
    bytes32 public root;
    address private dev = 0x0AF3f0461f2bEE2F18f405d0a4463A0cC131723D;

    mapping(address => uint256) public whiteListClaimed;
    mapping(address => bool) private giveawayMintClaimed;

    /*
     * Function to set Base URI
     */
    function setURI(string memory _URI) external onlyOwner {
        _contractBaseURI = _URI;
    }

    /*
     * Function to set NFT Price
     */
    function setNFTPrice(uint256 _price) external onlyOwner {
        NFTPrice = _price;
    }

    /*
     * Function to set the merkle root
     */
    function setRoot(uint256 _root) external onlyOwner {
        root = bytes32(_root);
    }

    /*
     * Function toggleActive to activate/desactivate the smart contract
     */
    function toggleActive() external onlyOwner {
        isActive = !isActive;
    }

    /*
     * Function togglePublicSale to activate/desactivate public sale
     */
    function togglePublicSale() external onlyOwner {
        isPublicSaleActive = !isPublicSaleActive;
    }

    /*
     * Function togglePresale to activate/desactivate  presale
     */
    function togglePresale() external onlyOwner {
        isPresaleActive = !isPresaleActive;
    }

    /*
    Function to activate/desactivate the free mint
    */
    function toggleFreeMint() external onlyOwner {
        isFreeMintActive = !isFreeMintActive;
    }

    /*
     * Function to mint all NFTs for giveaway
     */
    function giveawayMint(address[] memory _to) external onlyOwner {
        for (uint256 i = 0; i < _to.length; i++) {
            _safeMint(_to[i], 1);
        }
    }

    /*
     * Function to mint new NFTs during the public sale
     */
    function mintNFT(uint256 _numOfTokens) external payable {
        require(isActive, "Contract is not active");
        require(!isPresaleActive, "Presale is still active");
        require(_numOfTokens <= maxPerTransaction, "Cannot mint above limit");
        require(
            totalSupply() + _numOfTokens <= MAX_NFT_PUBLIC,
            "Purchase would exceed max public supply of NFTs"
        );
        require(
            NFTPrice * _numOfTokens <= msg.value,
            "Ether value sent is not correct"
        );

        _safeMint(msg.sender, _numOfTokens);
    }

    /*
     * Function to mint new NFTs during the presale
     */
    function mintNFTDuringPresale(uint256 _numOfTokens, bytes32[] memory _proof)
        external
        payable
    {
        require(isActive, "Sale is not active");
        require(isPresaleActive, "Whitelist is not active");
        require(
            verify(_proof, bytes32(uint256(uint160(msg.sender)))),
            "Not whitelisted"
        );
        require(
            totalSupply() < MAX_NFT_PUBLIC,
            "All public tokens have been minted"
        );

        if (!isFreeMintActive) {
            // require(_numOfTokens <= maxPerWalletPresale, "Cannot purchase this many tokens");
            require(
                whiteListClaimed[msg.sender] + _numOfTokens <=
                    maxPerWalletPresale,
                "Purchase exceeds max whitelisted"
            );
            require(
                totalSupply() + _numOfTokens <= MAX_NFT_PUBLIC,
                "Purchase would exceed max public supply of NFTs"
            );
            require(
                NFTPrice * _numOfTokens <= msg.value,
                "Ether value sent is not correct"
            );
            whiteListClaimed[msg.sender] += _numOfTokens;
            _safeMint(msg.sender, _numOfTokens);
        } else {
            require(_numOfTokens == 1, "Cannot purchase this many tokens");
            require(
                !giveawayMintClaimed[msg.sender],
                "Already claimed giveaway"
            );
            giveawayMintClaimed[msg.sender] = true;
            _safeMint(msg.sender, _numOfTokens);
        }
    }

    /*
     * Function to verify merkle proof
     */
    function verify(bytes32[] memory proof, bytes32 leaf)
        public
        view
        returns (bool)
    {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                computedHash = sha256(
                    abi.encodePacked(computedHash, proofElement)
                );
            } else {
                computedHash = sha256(
                    abi.encodePacked(proofElement, computedHash)
                );
            }
        }

        return computedHash == root;
    }

    /*
     * Function to withdraw collected amount during minting by the owner
     */
    function withdraw(address _to) public onlyOwner {
        require(address(this).balance > 0, "Balance should be more than zero");
        uint256 balance = address(this).balance;

        if (devSup > 0) {
            (bool sent, ) = dev.call{value: devSup}("");
            require(sent, "Failed to send Ether");
            balance = balance - devSup;
            devSup = 0;
        }

        (bool sent1, ) = _to.call{value: (balance * 990) / 1000}("");
        (bool sent2, ) = dev.call{value: (balance * 10) / 1000}("");
        require(sent1, "Failed to send Ether");
        require(sent2, "Failed to send Ether");
    }

    function _baseURI() internal view override returns (string memory) {
        return _contractBaseURI;
    }
}
