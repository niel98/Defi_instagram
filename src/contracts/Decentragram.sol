pragma solidity ^0.5.0;

contract Decentragram {
  string public name = 'Decentragram';

  //Store images
  uint public imageCount = 0;
  mapping (uint => Image) public images;

  struct Image {
    uint id;
    string hash;
    string description;
    uint tipAmount;
    address payable author;
  }

  event imageCreated (
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  event imageTipped (
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  //Create images
  function uploadImage (string memory _imgHash, string memory _description) public {
    //Make sure that the image hash exists
    require(bytes(_imgHash).length > 0);

    //make sure that the image description isn't blank
    require(bytes(_description).length > 0);

    //Make sure that the image is coming from an address
    require(msg.sender != address(0x0));

    //Increment the image id
    imageCount ++;

    images[imageCount] = Image(imageCount, _imgHash, _description, 0, msg.sender);

    //Trigger an event
    emit imageCreated(imageCount, _imgHash, _description, 0, msg.sender);
  }

  //Tip images
  function tipImage(uint _id) public payable {
    //Make sure that the image Id is valid
    require(_id > 0 && _id <= imageCount);
    //Fetch the image
    Image memory _image = images[_id];

    //Fetch the author
    address payable _author = _image.author;

    //tip the owner of the image by sending them ether
    address(_author).transfer(msg.value);

    //update the image tip amount
    _image.tipAmount = _image.tipAmount + msg.value;

    //update the image and put it back in the struct
    images[_id] = _image;

    //Trigger the imageTipped event
    emit imageTipped(_id, _image.hash, _image.description, _image.tipAmount, _author);
  }
}