const truffleAssert = require('truffle-assertions');
const Strategy = artifacts.require("Strategy");
const Token = artifacts.require("ERC20");
const VX = artifacts.require("VaultX");
const VY = artifacts.require("VaultY");
const IUniswap = artifacts.require("IUniswapV2Router01");
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
const UNISWAP_ADDRESS = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'
var web3 = require("web3");

contract("usdt test", async (accounts) => {
    //预置条件
    console.log(accounts)
    let GovernanceOfStrategy = accounts[0]
    let fakeGovernance = accounts[1]
    let Strategist = accounts[2]
    let GovernanceOfVault = accounts[3]
    let NewStrategy = accounts[6]
    let User = accounts[7]
    let Approved = web3.utils.toWei("1000","ether")
    // deposit 1 usdt
    let Amount = 1000000000
    // withdraw 0.2 usdt
    let AmountWithdraw = 200000000
    // withdraw to Pika in 0.2 usdt
    let AmountTransferToPika =  200000000
    let WrappedEth = web3.utils.toWei("10","ether")
    let SwappedUsdt = web3.utils.toWei("3","ether")
    let SwappedWbtc = web3.utils.toWei("3","ether")
    let Deadline = 1715889393
    // 4e16
    let FeeXE18 = web3.utils.toWei("0.04","ether");
    // 5e16
    let FeeYE18 = web3.utils.toWei("0.05","ether");
    // 6e16
    let FeePE18 = web3.utils.toWei("0.06","ether");
    // 5e17
    let _ne18 = web3.utils.toWei("0.5","ether");

    var strategy,weth,usdt,wbtc,vaultX,vaultY
    var governance_weth,strategy_weth,vaultX_weth,vaultY_weth,user_weth,governance_usdt,strategy_usdt,vaultX_usdt,vaultY_usdt,user_usdt,governance_wbtc,strategy_wbtc,vaultX_wbtc,vaultY_wbtc,user_wbtc

    before("Should wrap eth to weth and get some usdt and wbtc from uniswap", async()=>{
        strategy = await Strategy.new(USDT_ADDRESS)
        vaultX = await VX.new(USDT_ADDRESS,accounts[8])
        vaultY = await VY.new(USDT_ADDRESS,accounts[8])
        weth = await Token.at(WETH_ADDRESS)
        usdt = await Token.at(USDT_ADDRESS)
        wbtc = await Token.at(WBTC_ADDRESS)

        await weth.send(WrappedEth, {from: User});
        let uniswap = await IUniswap.at(UNISWAP_ADDRESS);

        // approve valutX to use my token.
        await weth.approve(vaultX.address,Approved,{from:User})
        await usdt.approve(vaultX.address,Approved,{from:User})
        await wbtc.approve(vaultX.address,Approved,{from:User})

        await weth.approve(vaultY.address,Approved,{from:User})
        await usdt.approve(vaultY.address,Approved,{from:User})
        await wbtc.approve(vaultY.address,Approved,{from:User})

        // Approving
        weth.approve(UNISWAP_ADDRESS,Approved,{from:User})
        usdt.approve(UNISWAP_ADDRESS,Approved,{from:User})
        wbtc.approve(UNISWAP_ADDRESS,Approved,{from:User})

        // uniswap some tokens(usdt and btc )
        uniswap.swapExactTokensForTokens(SwappedUsdt,0,[WETH_ADDRESS,USDT_ADDRESS],User,Deadline,{from:User})
        // uniswap.swapExactTokensForTokens(SwappedWbtc,0,[WETH_ADDRESS,USDT_ADDRESS],User,Deadline,{from:User})
    })

    beforeEach("Should calculate the every token amount", async()=>{
        governance_weth = await weth.balanceOf(GovernanceOfStrategy)
        strategy_weth = await weth.balanceOf(strategy.address)
        vaultX_weth = await weth.balanceOf(await strategy.x())
        vaultY_weth = await weth.balanceOf(await strategy.y())
        user_weth = await weth.balanceOf(User)

        governance_wbtc = await wbtc.balanceOf(GovernanceOfStrategy)
        strategy_wbtc = await wbtc.balanceOf(strategy.address)
        vaultX_wbtc = await wbtc.balanceOf(await strategy.x())
        vaultY_wbtc = await wbtc.balanceOf(await strategy.y())
        user_wbtc = await wbtc.balanceOf(User)

        governance_usdt = await usdt.balanceOf(GovernanceOfStrategy)
        strategy_usdt = await usdt.balanceOf(strategy.address)
        vaultX_usdt = await usdt.balanceOf(await strategy.x())
        vaultY_usdt = await usdt.balanceOf(await strategy.y())
        user_usdt = await usdt.balanceOf(User)
    })

    // something about vault
    it("Should change the governance of vaultX and vaultY",async()=>{
        await vaultX.setGovernance(GovernanceOfVault)
        await vaultY.setGovernance(GovernanceOfVault)
        assert.equal(GovernanceOfVault ,await vaultX.governance())
        assert.equal(GovernanceOfVault ,await vaultY.governance())
    }) 

    it("Should set Strategy",async()=>{
        await vaultX.setStrategy(strategy.address,{from:GovernanceOfVault})
        await vaultY.setStrategy(strategy.address,{from:GovernanceOfVault})
        assert.equal(strategy.address, await vaultX.strategy())
        assert.equal(strategy.address, await vaultY.strategy())
    })

    // something about strategy
    it("Should set governance", async () => {
        await strategy.setGovernance(GovernanceOfStrategy);
        let changedgovernance = await strategy.governance();
        assert.equal(GovernanceOfStrategy, changedgovernance);
    });

    it("Should return an error because of !perm", async() => {
        try {
            await strategy.setFeeXE18(FeeXE18,{from:fakeGovernance})
        } catch (error) {
            assert.notEqual(error.toString().indexOf("!perm"), -1)
        }
    })

    it("Should return an error because of !perm", async () => {
        try {
            await strategy.setFeeYE18(FeeYE18,{from:fakeGovernance})
        } catch (error) {
            assert.notEqual(error.toString().indexOf("!perm"), -1)
        }
    });

    it("Should set the VaultX" ,async ()=> {
        await strategy.setX(vaultX.address);
        let x = await strategy.x();
        assert.equal(vaultX.address,x);
    })

    it("Should set the VaultY" ,async ()=> {
        await strategy.setY(vaultY.address);
        let y = await strategy.y();
        assert.equal(vaultY.address, y);
    })

    it("Should set FeeXE18", async () => {
        await strategy.setFeeXE18(FeeXE18);
        let changedfeexe18 = await strategy.feexe18();
        assert.equal(FeeXE18, changedfeexe18);
    });

    it("Should set FeeYE18", async () => {
        await strategy.setFeeYE18(FeeYE18);
        let changedfeeye18 = await strategy.feeye18();
        assert.equal(FeeYE18, changedfeeye18);
    });
    
    it("Should set FeePE18", async () => {
        await strategy.setFeePE18(FeePE18);
        let changedfeepe18 = await strategy.feepe18();
        assert.equal(FeePE18, changedfeepe18);
    });

    it("Should Deposit some USDT via vaultX",async()=> {
        await vaultX.deposit(Amount, {from:User})

        let agovernance_usdt = await usdt.balanceOf(GovernanceOfStrategy)
        let astrategy_usdt = await usdt.balanceOf(strategy.address)
        let avaultX_usdt = await usdt.balanceOf(await strategy.x())
        let avaultY_usdt = await usdt.balanceOf(await strategy.y())
        let auser_usdt = await usdt.balanceOf(User)

        assert.equal(governance_usdt.toString(),agovernance_usdt.toString())
        assert.equal(strategy_usdt,(astrategy_usdt.sub(web3.utils.toBN(Amount))).toString())
        assert.equal(vaultX_usdt.toString(),avaultX_usdt.toString())
        assert.equal(avaultY_usdt.toString(),avaultY_usdt.toString())
        assert.equal(user_usdt.toString(),(auser_usdt.add(web3.utils.toBN(Amount)).toString()))


    })

    it("Should Deposit some usdt via vaultY",async()=>{
        await vaultY.deposit(Amount,{from:User})

        let agovernance_usdt = await usdt.balanceOf(GovernanceOfStrategy)
        let astrategy_usdt = await usdt.balanceOf(strategy.address)
        let avaultX_usdt = await usdt.balanceOf(await strategy.x())
        let avaultY_usdt = await usdt.balanceOf(await strategy.y())
        let auser_usdt = await usdt.balanceOf(User)

        assert.equal(governance_usdt.toString(),agovernance_usdt.toString())
        assert.equal(strategy_usdt,(astrategy_usdt.sub(web3.utils.toBN(Amount))).toString())
        assert.equal(vaultX_usdt.toString(),avaultX_usdt.toString())
        assert.equal(avaultY_usdt.toString(),avaultY_usdt.toString())
        assert.equal(user_usdt.toString(),(auser_usdt.add(web3.utils.toBN(Amount)).toString()))
    })

    it("Should set the strategist" ,async ()=> {
        await strategy.setStrategist(Strategist);
        let changedStrategist = await strategy.strategist();
        assert.equal(Strategist, changedStrategist);
    })

    it("Should exec without revert in depositing" ,async ()=> {
        await truffleAssert.passes(strategy.deposit(_ne18));
    })

    it("Should return 1 in calculating deposited token" ,async ()=> {
        let depositedToken = await strategy.deposited();
        assert.equal(depositedToken,1);
    })

    it("Should exec without revert in withdrawing" ,async ()=> {
        await truffleAssert.passes(strategy.withdraw(_ne18));
    })

    it("Should withdraw amount of token from vaule and token in vault is enough via vaultX", async()=> {
        await vaultX.withdraw(AmountWithdraw,{from:User})
        // check the balance of tokens in contract,governance,and WithdrawTo
        // the balanceof tokens in contract will be amount - withdraw
        // the balanceof tokens in governance will be feeX * withdraw more
        // the balanceof tokens in WithdrawTo will be (1e18 - feeX) * withdraw more

        let agovernance_usdt = await usdt.balanceOf(GovernanceOfStrategy)
        let astrategy_usdt = await usdt.balanceOf(strategy.address)
        let avaultX_usdt = await usdt.balanceOf(await strategy.x())
        let avaultY_usdt = await usdt.balanceOf(await strategy.y())
        let auser_usdt = await usdt.balanceOf(User)

        let feexe18 = await strategy.feexe18()

        assert.equal(agovernance_usdt.toString(), (governance_usdt.add(web3.utils.toBN(AmountWithdraw * feexe18 / 1e18))).toString())
        assert.equal(astrategy_usdt.toString(), (strategy_usdt.sub(web3.utils.toBN(AmountWithdraw))).toString())
        assert.equal(avaultX_usdt.toString(), vaultX_usdt.toString())
        assert.equal(avaultY_usdt.toString(), vaultY_usdt.toString())
        assert.equal(auser_usdt.toString(),(user_usdt.add(web3.utils.toBN(AmountWithdraw - AmountWithdraw * feexe18 / 1e18))).toString())
    })

    it("Should return the balanceOfY", async ()=>{
        let totalSupplyOfVaultX = await vaultX.totalSupply()
        let balanceOfY = await strategy.balanceOfY()
        assert.equal((web3.utils.toBN(strategy_usdt).sub(web3.utils.toBN(totalSupplyOfVaultX)).add(web3.utils.toBN('1'))).toString(), balanceOfY.toString())
    })

    it("Should withdraw amount of token from vaule and token in vault is enough via vaultY", async()=> {
        await vaultY.withdraw(AmountWithdraw,{from:User})
        // check the balance of tokens in contract,governance,and WithdrawTo
        // the balanceof tokens in contract will be amount - withdraw
        // the balanceof tokens in governance will be feeX * withdraw more
        // the balanceof tokens in WithdrawTo will be (1e18 - feeX) * withdraw more

        let agovernance_usdt = await usdt.balanceOf(GovernanceOfStrategy)
        let astrategy_usdt = await usdt.balanceOf(strategy.address)
        let avaultX_usdt = await usdt.balanceOf(await strategy.x())
        let avaultY_usdt = await usdt.balanceOf(await strategy.y())
        let auser_usdt = await usdt.balanceOf(User)

        let feeye18 = await strategy.feeye18()

        assert.equal(agovernance_usdt.toString(), (governance_usdt.add(web3.utils.toBN(AmountWithdraw * feeye18 / 1e18))).toString())
        assert.equal(astrategy_usdt.toString(), (strategy_usdt.sub(web3.utils.toBN(AmountWithdraw))).toString())
        assert.equal(avaultX_usdt.toString(), vaultX_usdt.toString())
        assert.equal(avaultY_usdt.toString(), vaultY_usdt.toString())
        assert.equal(auser_usdt.toString(),(user_usdt.add(web3.utils.toBN(AmountWithdraw - AmountWithdraw * feeye18 / 1e18))).toString())
    })

    it("Should withdraw amount of token from vaule and token in vault is NOT enough", async()=> {
        try {
            let xToken = await vaultX.balanceOf(User)
            let yToken = await vaultY.balanceOf(User)

            await vaultY.withdraw(yToken, {from: User})

            let governance_usdt = await usdt.balanceOf(GovernanceOfStrategy)
            let strategy_usdt = await usdt.balanceOf(strategy.address)
            let vaultX_usdt = await usdt.balanceOf(await strategy.x())
            let vaultY_usdt = await usdt.balanceOf(await strategy.y())
            let user_usdt = await usdt.balanceOf(User)

            await vaultX.withdraw(xToken, {from: User})
            // check the balance of tokens in contract,governance,and WithdrawTo
            // the balanceof tokens in contract will be amount - withdraw
            // the balanceof tokens in governance will be feeX * withdraw more
            // the balanceof tokens in WithdrawTo will be (1e18 - feeX) * withdraw more

            let agovernance_usdt = await usdt.balanceOf(GovernanceOfStrategy)
            let astrategy_usdt = await usdt.balanceOf(strategy.address)
            let avaultX_usdt = await usdt.balanceOf(await strategy.x())
            let avaultY_usdt = await usdt.balanceOf(await strategy.y())
            let auser_usdt = await usdt.balanceOf(User)

            let feexe18 = await strategy.feexe18()

            assert.equal(agovernance_usdt.toString(), (governance_usdt.add(web3.utils.toBN(strategy_usdt * feexe18 / 1e18))).toString())
            assert.equal(astrategy_usdt.toString(), (strategy_usdt.sub(web3.utils.toBN(strategy_usdt))).toString())
            assert.equal(avaultX_usdt.toString(), vaultX_usdt.toString())
            assert.equal(avaultY_usdt.toString(), vaultY_usdt.toString())
            assert.equal(auser_usdt.toString(), (user_usdt.add(web3.utils.toBN(strategy_usdt - strategy_usdt * feexe18 / 1e18))).toString())
        } catch (error) {
            assert.notEqual(error.toString().indexOf("!perm"), -1)
        }
    })

    it("Should transfer to governance address with pika", async ()=> {
        await strategy.pika(USDT_ADDRESS,AmountTransferToPika)
        // after
        let agovernance_usdt = await usdt.balanceOf(GovernanceOfStrategy);
        let astrategy_usdt = await usdt.balanceOf(strategy.address)
        assert.equal(agovernance_usdt.sub(web3.utils.toBN(AmountTransferToPika)).toString(), governance_usdt.toString());
        assert.equal(astrategy_usdt.add(web3.utils.toBN(AmountTransferToPika)).toString(), strategy_usdt.toString());
    })

    it("Should update the strategy", async()=>{
        let balanceOfNewStrategy = await usdt.balanceOf(NewStrategy)
        await strategy.update(NewStrategy)
        // check if the newStrategy will receive all the tokens from address(this)
        let abalanceOfNewStrategy = await usdt.balanceOf(NewStrategy)
        assert.equal(abalanceOfNewStrategy.toString(),(balanceOfNewStrategy.add(strategy_usdt)).toString())
        let changedStrategyofX = await vaultX.strategy()
        let changedStrategyofY = await vaultY.strategy()
        assert.equal(NewStrategy,changedStrategyofX)
        assert.equal(NewStrategy,changedStrategyofY)
    })
});