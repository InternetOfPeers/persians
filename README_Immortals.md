# IMMORTAL TOKEN ICO Instructions & Tutorial
## ICO Announcement

https://bitcointalk.org/index.php?topic=2043872.0

## Warriors Description

The Persian Immortals were the special forces of the ancient world. They were trained from the age of five to do nothing but kill and destroy other soldiers.

*The Immortal army was created due the creation of the Athenians army to make the battle smart contract more balanced and realistic as possible. They will support Persian Warriors on the first battle contract fighting side by side against Greek army*

## Technical Specification

Each Immortal warrior as a value in BP equals to BP value of one **Athenian warrior** defined in the battle contract rules. Moreover the Immortal warrior **could not died** in the battle but **will be sent back** to contributor address after the end of the battle.

- Total token supply: 100 IMT
- Decimals: 18
- Smart Contract Address: `0x163733bcc28dbf26B41a8CfA83e369b5B3af741b`

## Contribution
### To Contribute from any “Full” wallet address:
*This includes any wallet not using a smart-contract to store your balance. So far we've tested this with Geth, Solidity, and MyEtherWallet. For any other wallet type, please either verify if it's using a smart-contract to handle your transactions/balance, OR to play it sade, use the "Execute a function" instructions below, and execute the "contribute" function to participate.*

**(do NOT use this method to send from a multi-sig contract, or any other contract based wallet. It will fail to work because of gas stipend limits.)**

**It is important to include a minimum of 80,000 Gas with the transaction**
1. Send Ether to the ICO contract address in the amount you would like to contribute.
ICO Contract Address: `0x163733bcc28dbf26B41a8CfA83e369b5B3af741b`
2. Remember to include at least 80,000 gas with the transaction. Some wallets (such as Parity) should automatically detect the correct amount. But others may detect the default (such as 21,000) and if you send without increasing this, the tx will fail!
2. You will be awarded balance based on your contribution, and can continue to send additional transactions in the future.
3. At any time you can check your balance, using the steps below
4. At ICO completion, you execute the “claimToken()” function on the contract, which will send your new PRS tokens to the same address you used to send in your contribution.

*If you are using a contract, or a multi-sig wallet, or any other contract based wallet, you must instead execute the “contribute” function on the contract, sending along with it the amount of ETH you wish to contribute. Otherwise all of the above steps still apply.*

## To Execute a Function on the ICO Contract:
**Note** *If you are executing any function which returns a value of "Tokens" it will return the "raw" number of PRS tokens, which must be divided by 1,000,000,000,000,000,000 in order to get the "Actual" number of PRS tokens.*
eg: `197,321,000,000,000,000,000,000 = 197.321 PRS`
### For Parity Users:
1. Access the Parity Web UI
2. If you don't have a "Contracts" tab, go to the "Settings" tab, and check the box to enable it.
3. Go to the Contracts Tab
4. Click the +Watch Button
5. Choose “Custom Contract” and click Next
6. Paste the following address into the “network address” field:
`0x163733bcc28dbf26B41a8CfA83e369b5B3af741b`
7. Type in “ImmortalTokenICO” In the “contract name” field
8. Type a description such as "Immortal Token ICO Contract" in the description field
9. Paste the ABI code from the section below into the ABI field. (note you can select it easily in chrome by tripleclicking in the text field with the ABI below)
10. Click the "add contract" button
11. Now the contract will appear in your list of saved contracts. You can click on it to view all of the functions which can be read or queried without requiring a transaction, such as the "isICOOpen", "isICOEnded", "estimateBalanceOf", "balanceOf" functions.
12. If you wish to execute a function requiring a transaction such as "contribute" or "claimToken" you will need to click on the "Execute" button near the top of the page.
13. Then click the address you wish to execute the function from
14. And choose the function you wish to execute from the dropdown list

### For myEtherWallet 
1. Access your myEtherWallet account (note if you don't have a wallet, follow this tutorial to create a wallet: https://myetherwallet.groovehq.com/knowledge_base/topics/how-do-i-create-a-new-wallet )
2. Once you have accessed your wallet, you can navigate to the "Contracts" tab
3. Insert`0x163733bcc28dbf26B41a8CfA83e369b5B3af741b` in "Contract Address"
4. Insert the Contract ABI inside "ABI / JSON Interface"
5. Click the "Access" button. This will then pop up below a "Read/Write Contract" section, with a "Select a Function" dropdown.
6. You can now select the function you wish to access using the dropdown, and it will either show you the value of the query (for example if you check isICOOpen, it will return "True" or "False") or it will present you with a "Write" button.
7. Click the "Write" button, and it will prompt you any variables to provide, and an amount of ether to send. So for example if you are calling "Contribute" you can send in Ether this way to contribute to the ICO. 
8. If you wish to check the balance of a contributor, choose balanceOf function, and provide the address you want to check.

## ICO Contract Function Description:
Variable/Function | Purpose
--- | ---
`name` | The official name of the smart contract
`icoStartBlock` | The Block Number at which the ICO officially begins accepting contributions
`icoEndBlock` | The Block Number at which the ICO is officially over
`totalSupply` | The official Number of Immortal Token generated by the contract
`isICOOpen` | Boolean (True or False) is the ICO open ?
`isICOEnded` | Boolean (True or False) is the ICO over ?
`contribute()` | send in contribution (send ETH along with execution)
`estimatedBalanceOf` | Returns the number of Token Balance that could be held for `account` during ICO is open
`balanceOf` | Returns the number of Token Balance held for `account`
`redeemEther` | This function is called by the smart contract owner to pay out the Creator

## Contract ABI
```
[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"icoStartBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"maxTotalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalContributions","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"contributions","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"claimToken","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"icoEndBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"estimateBalanceOf","outputs":[{"name":"estimatedTokens","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"isICOOpen","outputs":[{"name":"_open","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"isICOEnded","outputs":[{"name":"_ended","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_extraData","type":"bytes"}],"name":"approveAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"contribute","outputs":[{"name":"success","type":"bool"}],"payable":true,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"redeemEther","outputs":[],"payable":false,"type":"function"},{"inputs":[{"name":"_icoStartBlock","type":"uint256"},{"name":"_icoEndBlock","type":"uint256"}],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_contributor","type":"address"},{"indexed":false,"name":"_value","type":"uint256"},{"indexed":false,"name":"_estimatedTotalTokenBalance","type":"uint256"}],"name":"Contributed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_contributor","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]
```
