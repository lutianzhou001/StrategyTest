const Strategy = artifacts.require("Strategy");
const Token = artifacts.require("ERC20");
const VX = artifacts.require("VaultX");
const VY = artifacts.require("VaultY");
const truffleAssert = require('truffle-assertions');
const IWeth9 = artifacts.require("IWETH9");
const IUniswap = artifacts.require("IUniswap");
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
const UNISWAP_ADDRESS = '7a250d5630b4cf539739df2c5dacb4c659f2488d'
var web3 = require("web3");

contract("Str test", async (accounts) => {
    //预置条件
    console.log(accounts)
    let GovernanceOfStrategy = accounts[0]
    let fakeGovernance = accounts[1]
    let Strategist = accounts[2]
    let GovernanceOfVault = accounts[3]
    let NewStrategy = accounts[6]
    let User = accounts[7]
    let Approved = web3.utils.toWei("1000","ether")
    let Amount = web3.utils.toWei("0.02",'ether')
    let AmountWithdraw = web3.utils.toWei("0.01",'ether')
    let AmountTransferToPika =  web3.utils.toWei("0.001", "ether")
    let WrappedEth = web3.utils.toWei("10","ether")
    let SwappedUsdt = web3.utils.toWei("3","ether")
    let SwappedWbtc = web3.utils.toWei("3","ether")
    let deadline = 1715889393
    let Deadline =
    // 4e16
    let FeeXE18 = web3.utils.toWei("0.04","ether");
    // 5e16
    let FeeYE18 = web3.utils.toWei("0.05","ether");
    // 6e16
    let FeePE18 = web3.utils.toWei("0.06","ether");
    // 5e17
    let _ne18 = web3.utils.toWei("0.5","ether");

    before("Should wrap eth to weth", async()=>{
        let weth = await IWeth9.at(WETH_ADDRESS)
        let usdt = await Token.at(USDT_ADDRESS)
        let wbtc = await Token.at(WBTC_ADDRESS)
        await weth.send(WrappedEth, {from: User});
        // let's swap some usdt and wbtc with weths
        let uniswap = await IUniswap.at(UNISWAP_ADDRESS);
        weth.approve(UNISWAP_ADDRESS,Approved)
        usdt.approve(UNISWAP_ADDRESS,Approved)
        wbtc.approve(UNISWAP_ADDRESS,Approved)
        uniswap.swapExactTokensForTokens(SwappedUsdt,[WETH_ADDRESS,USDT_ADDRESS],User,deadline,{from:User})
        uniswap.swapExactTokensForTokens(SwappedWbtc,[WETH_ADDRESS,USDT_ADDRESS],User,deadline,{from:User})
    })

    // something about vault
    it("Should change the governance of vaultX and vaultY",async()=>{
        let vaultX = await VX.deployed()
        let vaultY = await VY.deployed()
        await vaultX.setGovernance(GovernanceOfVault)
        await vaultY.setGovernance(GovernanceOfVault)
        assert.equal(GovernanceOfVault ,await vaultX.governance())
        assert.equal(GovernanceOfVault ,await vaultY.governance())
    }) 

    it("Should set Strategy",async()=>{
        let vaultX = await VX.deployed()
        let vaultY = await VY.deployed()
        let instance = await Strategy.deployed()
        await vaultX.setStrategy(instance.address,{from:GovernanceOfVault})
        await vaultY.setStrategy(instance.address,{from:GovernanceOfVault})
        assert.equal(instance.address, await vaultX.strategy())
        assert.equal(instance.address, await vaultY.strategy())
    })

    // something about strategy
    it("Should set governance", async () => {
        let instance = await Strategy.deployed();
        await instance.setGovernance(GovernanceOfStrategy);
        let changedgovernance = await instance.governance();
        assert.equal(GovernanceOfStrategy, changedgovernance);
    });

    it("Should return an error because of !perm", async() => {
        let instance = await Strategy.deployed();
        try {
            await instance.setFeeXE18(FeeXE18,{from:fakeGovernance})
        } catch (error) {
            assert.notEqual(error.toString().indexOf("!perm"), -1)
        }
    })

    it("Should return an error because of !perm", async () => {
        let instance = await Strategy.deployed();
        try {
            await instance.setFeeYE18(FeeYE18,{from:fakeGovernance})
        } catch (error) {
            assert.notEqual(error.toString().indexOf("!perm"), -1)
        }
    });

    it("Should set the VaultX" ,async ()=> {
        let instance = await Strategy.deployed();
        let vaultX = await VX.deployed()
        await instance.setX(vaultX.address);
        let x = await instance.x();
        assert.equal(vaultX.address,x);
    })

    it("Should set the VaultY" ,async ()=> {
        let instance = await Strategy.deployed();
        let vaultY = await VY.deployed()
        await instance.setY(vaultY.address);
        let y = await instance.y();
        assert.equal(vaultY.address, y);
    })

    it("Should set FeeXE18", async () => {
        let instance = await Strategy.deployed();
        await instance.setFeeXE18(FeeXE18);
        let changedfeexe18 = await instance.feexe18();
        assert.equal(FeeXE18, changedfeexe18);
    });

    it("Should set FeeYE18", async () => {
        let instance = await Strategy.deployed();
        await instance.setFeeYE18(FeeYE18);
        let changedfeeye18 = await instance.feeye18();
        assert.equal(FeeYE18, changedfeeye18);
    });
    
    it("Should set FeePE18", async () => {
        let instance = await Strategy.deployed();
        await instance.setFeePE18(FeePE18);
        let changedfeepe18 = await instance.feepe18();
        assert.equal(FeePE18, changedfeepe18);
    });

    it("Should Deposit some WETH",async()=> {
        let WETH = await Token.at(WETH_ADDRESS);
        let instance = await Strategy.deployed();
        let Governance_WETH = await WETH.balanceOf(GovernanceOfStrategy)
        let Strategy_WETH = await WETH.balanceOf(instance.address)
        let VaultX_WETH = await WETH.balanceOf(await instance.x())
        let VaultY_WETH = await WETH.balanceOf(await instance.y())
        let User_WETH = await WETH.balanceOf(User)

        let vaultX = await VX.deployed()
        await WETH.approve(vaultX.address,User_WETH,{from:User})
        await vaultX.deposit(Amount, {from:User})
        // after deposit the msg.sender will deposit some tokens from vault to strategy

        let AGovernance_WETH = await WETH.balanceOf(GovernanceOfStrategy)
        let AStrategy_WETH = await WETH.balanceOf(instance.address)
        let AVaultX_WETH = await WETH.balanceOf(await instance.x())
        let AVaultY_WETH = await WETH.balanceOf(await instance.y())
        let AUser_WETH = await WETH.balanceOf(User)

        assert.equal(Governance_WETH.toString(),AGovernance_WETH.toString())
        assert.equal(Strategy_WETH,(AStrategy_WETH.sub(web3.utils.toBN(Amount))).toString())
        assert.equal(VaultX_WETH.toString(),AVaultX_WETH.toString())
        assert.equal(VaultY_WETH.toString(),AVaultY_WETH.toString())
        assert.equal(User_WETH.toString(),(AUser_WETH.add(web3.utils.toBN(Amount)).toString()))

        let vaultY = await VY.deployed()
        await WETH.approve(vaultY.address,User_WETH,{from:User})
        await vaultY.deposit(Amount,{from:User})

        let AAGovernance_WETH = await WETH.balanceOf(GovernanceOfStrategy)
        let AAStrategy_WETH = await WETH.balanceOf(instance.address)
        let AAVaultX_WETH = await WETH.balanceOf(await instance.x())
        let AAVaultY_WETH = await WETH.balanceOf(await instance.y())
        let AAUser_WETH = await WETH.balanceOf(User)

        assert.equal(AGovernance_WETH.toString(), AAGovernance_WETH.toString())
        assert.equal(AStrategy_WETH,(AAStrategy_WETH.sub(web3.utils.toBN(Amount))).toString())
        assert.equal(AVaultX_WETH.toString(),AAVaultX_WETH.toString())
        assert.equal(AVaultY_WETH.toString(),AAVaultY_WETH.toString())
        assert.equal(AUser_WETH.toString(),(AAUser_WETH.add(web3.utils.toBN(Amount)).toString()))
    })

    it("Should set the strategist" ,async ()=> {
        let instance = await Strategy.deployed();
        await instance.setStrategist(Strategist);
        let changedStrategist = await instance.strategist();
        assert.equal(Strategist, changedStrategist);
    })

    it("Should exec without revert in depositing" ,async ()=> {
        let instance = await Strategy.deployed();
        await truffleAssert.passes(instance.deposit(_ne18));
    })

    it("Should return 1 in calculating deposited token" ,async ()=> {
        let instance = await Strategy.deployed();
        let depositedToken = await instance.deposited();
        assert.equal(depositedToken,1);
    })

    it("Should exec without revert in withdrawing" ,async ()=> {
        let instance = await Strategy.deployed();
        await truffleAssert.passes(instance.withdraw(_ne18));
    })

    it("Should withdraw amount of token from vaule and token in vault is enough", async()=> {
        let instance = await Strategy.deployed()
        let vaultX = await VX.deployed()
        let WETH = await Token.at(WETH_ADDRESS);

        let Governance_WETH = await WETH.balanceOf(GovernanceOfStrategy)
        let Strategy_WETH = await WETH.balanceOf(instance.address)
        let VaultX_WETH = await WETH.balanceOf(await instance.x())
        let VaultY_WETH = await WETH.balanceOf(await instance.y())
        let User_WETH = await WETH.balanceOf(User)

        await vaultX.withdraw(AmountWithdraw,{from:User})
        // check the balance of tokens in contract,governance,and WithdrawTo
        // the balanceof tokens in contract will be amount - withdraw
        // the balanceof tokens in governance will be feeX * withdraw more
        // the balanceof tokens in WithdrawTo will be (1e18 - feeX) * withdraw more

        let AGovernance_WETH = await WETH.balanceOf(GovernanceOfStrategy)
        let AStrategy_WETH = await WETH.balanceOf(instance.address)
        let AVaultX_WETH = await WETH.balanceOf(await instance.x())
        let AVaultY_WETH = await WETH.balanceOf(await instance.y())
        let AUser_WETH = await WETH.balanceOf(User)

        let feexe18 = await instance.feexe18()

        assert.equal(AGovernance_WETH.toString(), (Governance_WETH.add(web3.utils.toBN(AmountWithdraw * feexe18 / 1e18))).toString())
        assert.equal(AStrategy_WETH.toString(), (Strategy_WETH.sub(web3.utils.toBN(AmountWithdraw))).toString())
        assert.equal(AVaultX_WETH.toString(), VaultX_WETH.toString())
        assert.equal(AVaultY_WETH.toString(),VaultY_WETH.toString())
        assert.equal(AUser_WETH.toString(),(User_WETH.add(web3.utils.toBN(AmountWithdraw - AmountWithdraw * feexe18 / 1e18))).toString())
    })

    it("Should return the balanceOfY", async ()=>{
        let instance = await Strategy.deployed()
        let WETH = await Token.at(WETH_ADDRESS)
        let vaultX = await VX.deployed()
        let balanceOfTokenInContract = await WETH.balanceOf(instance.address)
        let totalSupplyOfVaultX = await vaultX.totalSupply()
        let balanceOfY = await instance.balanceOfY()
        assert.equal((web3.utils.toBN(balanceOfTokenInContract).sub(web3.utils.toBN(totalSupplyOfVaultX)).add(web3.utils.toBN('1'))).toString(), balanceOfY.toString())
    })

    it("Should withdraw amount of token from vaule and token in vault is enough", async()=> {
        let instance = await Strategy.deployed()
        let vaultY = await VY.deployed()
        let WETH = await Token.at(WETH_ADDRESS);

        let Governance_WETH = await WETH.balanceOf(GovernanceOfStrategy)
        let Strategy_WETH = await WETH.balanceOf(instance.address)
        let VaultX_WETH = await WETH.balanceOf(await instance.x())
        let VaultY_WETH = await WETH.balanceOf(await instance.y())
        let User_WETH = await WETH.balanceOf(User)
        await vaultY.withdraw(AmountWithdraw,{from:User})

        // check the balance of tokens in contract,governance,and WithdrawTo
        // the balanceof tokens in contract will be amount - withdraw
        // the balanceof tokens in governance will be feeX * withdraw more
        // the balanceof tokens in WithdrawTo will be (1e18 - feeX) * withdraw more

        let AGovernance_WETH = await WETH.balanceOf(GovernanceOfStrategy)
        let AStrategy_WETH = await WETH.balanceOf(instance.address)
        let AVaultX_WETH = await WETH.balanceOf(await instance.x())
        let AVaultY_WETH = await WETH.balanceOf(await instance.y())
        let AUser_WETH = await WETH.balanceOf(User)

        let feeye18 = await instance.feeye18()

        assert.equal(AGovernance_WETH.toString(), (Governance_WETH.add(web3.utils.toBN(AmountWithdraw * feeye18 / 1e18))).toString())
        assert.equal(AStrategy_WETH.toString(), (Strategy_WETH.sub(web3.utils.toBN(AmountWithdraw))).toString())
        assert.equal(AVaultX_WETH.toString(), VaultX_WETH.toString())
        assert.equal(AVaultY_WETH.toString(),VaultY_WETH.toString())
        assert.equal(AUser_WETH.toString(),(User_WETH.add(web3.utils.toBN(AmountWithdraw - AmountWithdraw * feeye18 / 1e18))).toString())
    })

    it("Should withdraw amount of token from vaule and token in vault is NOT enough", async()=> {
        try {
            let instance = await Strategy.deployed()
            let vaultX = await VX.deployed()
            let vaultY = await VY.deployed()
            let WETH = await Token.at(WETH_ADDRESS);
            let xToken = await vaultX.balanceOf(User)
            let yToken = await vaultY.balanceOf(User)

            await vaultY.withdraw(yToken, {from: User})

            let Governance_WETH = await WETH.balanceOf(GovernanceOfStrategy)
            let Strategy_WETH = await WETH.balanceOf(instance.address)
            let VaultX_WETH = await WETH.balanceOf(await instance.x())
            let VaultY_WETH = await WETH.balanceOf(await instance.y())
            let User_WETH = await WETH.balanceOf(User)


            await vaultX.withdraw(xToken, {from: User})

            // check the balance of tokens in contract,governance,and WithdrawTo
            // the balanceof tokens in contract will be amount - withdraw
            // the balanceof tokens in governance will be feeX * withdraw more
            // the balanceof tokens in WithdrawTo will be (1e18 - feeX) * withdraw more

            let AGovernance_WETH = await WETH.balanceOf(GovernanceOfStrategy)
            let AStrategy_WETH = await WETH.balanceOf(instance.address)
            let AVaultX_WETH = await WETH.balanceOf(await instance.x())
            let AVaultY_WETH = await WETH.balanceOf(await instance.y())
            let AUser_WETH = await WETH.balanceOf(User)

            let feexe18 = await instance.feexe18()

            assert.equal(AGovernance_WETH.toString(), (Governance_WETH.add(web3.utils.toBN(Strategy_WETH * feexe18 / 1e18))).toString())
            assert.equal(AStrategy_WETH.toString(), (Strategy_WETH.sub(web3.utils.toBN(Strategy_WETH))).toString())
            assert.equal(AVaultX_WETH.toString(), VaultX_WETH.toString())
            assert.equal(AVaultY_WETH.toString(), VaultY_WETH.toString())
            assert.equal(AUser_WETH.toString(), (User_WETH.add(web3.utils.toBN(Strategy_WETH - Strategy_WETH * feexe18 / 1e18))).toString())
        } catch (error) {
            assert.notEqual(error.toString().indexOf("!perm"), -1)
        }
    })

    it("Should transfer to governance address with pika", async ()=> {
        let instance = await Strategy.deployed();
        let WETH = await Token.at(WETH_ADDRESS);
        // before
        let balanceOfTokenInGovernance = await WETH.balanceOf(GovernanceOfStrategy);
        let balanceOfTokenInContract = await WETH.balanceOf(instance.address);

        await instance.pika(WETH_ADDRESS,AmountTransferToPika)
        // after
        let AbalanceOfTokenInGovernance = await WETH.balanceOf(GovernanceOfStrategy);
        let AbalanceOfTokenInContract = await WETH.balanceOf(instance.address)
        assert.equal(AbalanceOfTokenInGovernance.sub(web3.utils.toBN(AmountTransferToPika)).toString(), balanceOfTokenInGovernance.toString());
        assert.equal(AbalanceOfTokenInContract.add(web3.utils.toBN(AmountTransferToPika)).toString(), balanceOfTokenInContract.toString());
    })

    it("Should update the strategy", async()=>{
        let instance = await Strategy.deployed()
        let WETH = await Token.at(WETH_ADDRESS);
        let vaultX = await VX.deployed()
        let vaultY = await VY.deployed()
        // change the valut governnance to instance's address
        let balanceOfThis = await WETH.balanceOf(instance.address)
        let balanceOfNewStrategy = await WETH.balanceOf(NewStrategy)
        await instance.update(NewStrategy)
        // check if the newStrategy will receive all the tokens from address(this)
        let AbalanceOfNewStrategy = await WETH.balanceOf(NewStrategy)
        assert.equal(AbalanceOfNewStrategy.toString(),(balanceOfNewStrategy.add(balanceOfThis)).toString())
        let changedStrategyofX = await vaultX.strategy()
        let changedStrategyofY = await vaultY.strategy()
        assert.equal(NewStrategy,changedStrategyofX)
        assert.equal(NewStrategy,changedStrategyofY)
    })
});