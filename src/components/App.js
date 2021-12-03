import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'

const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) //Using the default values from infura


class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3 () {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Non-ethereum browser detected. You should consider using metamask!')
    }
  }

  async loadBlockchainData () {
    const web3 = window.web3
    //load the account from the blockchain
    const accounts = await web3.eth.getAccounts()
    console.log(accounts[0])

    //Get the network Id
    const networkId = await web3.eth.net.getId()
    const networkData = await Decentragram.networks[networkId]
    if (networkData) {
      const decentragram = await web3.eth.Contract(Decentragram.abi, networkData.address)
      this.setState({ decentragram })

      const imagesCount = await decentragram.methods.imageCount().call()
      this.setState({ imagesCount })

      //load images
      for (let i = 0; i <= imagesCount; i++) {
        const image = await decentragram.methods.images(i).call()
        this.setState({ images: [...this.state.images, image] })
      }

      //Sort images according to the most tipped image
      this.setState({
        images: this.state.images.sort((a, b) => b.tipAmount - a.tipAmount)
      })
      
      this.setState({ loading: false })
    } else {
      window.alert('Contract has not been deployed to detected network')
    }

    this.setState({
      account: accounts[0]
    })
  }

  captureFile = e => {
    e.preventDefault()
    const file = e.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result)})
      console.log('buffer: ', this.state.buffer)
    }
  }

  uploadImage = description => {
    console.log('Submitting file to ipfs...')
    //Uploading the image to IPFS
    ipfs.add(this.state.buffer, (err, result) => {
      console.log('Ipfs result: ', result)
      if (err) {
        console.error(err)
        return
      }

      this.setState({ loading: true })
      this.state.decentragram.methods.uploadImage(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
      // this.setState({ loading: false })
    })
  }

  tipImageOwner = (id, tipAmount) => {
    this.setState({ loading: true })
    this.state.decentragram.methods.tipImage(id).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      decentragram: null,
      images: [],
      loading: true
    }
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
            images={this.state.images}
            captureFile={this.captureFile}
            uploadImage={this.uploadImage}
            tipImageOwner={this.tipImageOwner}
            />
          }
      </div>
    );
  }
}

export default App;