const { ethers } = require('hardhat')
const { expect } = require('chai')

describe('safe-exercise', () => {

  async function getAddresses() {
    const [owner, family1, family2, family3, nonFamily1, nonFamily2, nonFamily3] = await ethers.getSigners()
    return {
      owner,
      family1,
      family2,
      family3,
      nonFamily1,
      nonFamily2,
      nonFamily3
    }
  }

  async function deployContract(family) {
    const Contract = await ethers.getContractFactory('OurSaves')
    let contract = await Contract.deploy(family.map(f => f.address))
    contract = await contract.deployed()

    return contract
  }

  function valueTx(to, amount) {
    return {to, value: ethers.utils.parseEther(`${amount}`)}
  }

  
  it("Should let anyone deposit", async () => {
    const {owner, family2, nonFamily3} = await getAddresses()
    const contract = await deployContract([family2, nonFamily3])

    const transaction1 = await owner.sendTransaction(valueTx(contract.address, 177))
    const transaction2 = await family2.sendTransaction(valueTx(contract.address, 150))
    const transaction3 = await nonFamily3.sendTransaction(valueTx(contract.address, 225))

    await expect(transaction1).to.emit(contract, "Received")
    await expect(transaction2).to.emit(contract, "Received")
    await expect(transaction3).to.emit(contract, "Received")
  })


  it("Shouldn't let a non family member nor owner withdraw", async () => {
    const {family1, family2, family3, nonFamily2, nonFamily3} = await getAddresses()
    const contract = await deployContract([family1, family2, family3])

    await family1.sendTransaction(valueTx(contract.address, 365))
    await nonFamily3.sendTransaction(valueTx(contract.address, 400))

    await expect(contract.connect(nonFamily2).withdraw(ethers.utils.parseEther("369"))).to.be.revertedWith("Only family members can withdraw")
    await expect(contract.connect(nonFamily3).withdraw(ethers.utils.parseEther("227"))).to.be.revertedWith("Only family members can withdraw")
  })
  

  it("Should let a family member and the owner withdraw", async () => {
    const {family1, family2, nonFamily2, owner} = await getAddresses()
    const contract = await deployContract([family1, family2])

    await family1.sendTransaction(valueTx(contract.address, 300))
    await nonFamily2.sendTransaction(valueTx(contract.address, 446))

    await expect(contract.connect(family2).withdraw(ethers.utils.parseEther("369"))).to.emit(contract, "Withdrawed")
    await expect(contract.connect(owner).withdraw(ethers.utils.parseEther("227"))).to.emit(contract, "Withdrawed")
  })


  it("Shouldn't let withdraw if it doesn't have enough funds", async () => {
    const {family1, family2, owner} = await getAddresses()
    const contract = await deployContract([family1, family2, owner])
    const fundsToTest = 398

    await family1.sendTransaction(valueTx(contract.address, fundsToTest))
    await expect(contract.connect(owner).withdraw(ethers.utils.parseEther(`${fundsToTest}`))).to.emit(contract, "Withdrawed")

    await family1.sendTransaction(valueTx(contract.address, fundsToTest))
    await expect(contract.connect(owner).withdraw(ethers.utils.parseEther(`${fundsToTest + 1}`))).to.be.revertedWith("The account doesn't have enough funds")
  })
})