# Ol-Explorer - ARCHIVED

This project is intended to be run together with the [ByzCoin](https://github.com/c4dt/byzcoin) blockchain.
To test it locally, we recommend that you follow the instructions for setting up the ByzCoin project,
and choose "Go to the OL Explorer" in the application menu.

## Description

Different explorer exist now for OmniLedger.
This one has as a goal a simple interface for programmers to deep-dive into the structures.
Working together with StackBlitz, it is possible to have a very simple interface to all data available.

You can find an installed version here:
- https://demo.c4dt.org/ol-explorer
And a version directly on StackBlitz:
- https://stackblitz.com/github/c4dt/ol-explorer

There are some exercises in pdf-form: [Exercises.pdf](./Exercises.pdf)

## Layout

### Block navigator

On top of the screen is a simple block-explorer that shows the 4 latest blocks connected through their
highest-level backlinks.
Clicking on one of the blocks shows the header and the footer of the block.
Also information about transactions in the block are available.

### Information about the user

It is possible to add a wallet of a user to the ol-explorer, which allows you to create transactions
and send them to the blockchain.
If you already have a wallet on demo.c4dt.org, then this wallet will be picked up automatically.
Else you can contact [c4dt-dev](mailto:c4dt-dev@epfl.ch) to get a wallet.

### Pre-defined actions

If you don't have a wallet, only the following three actions are available:
- Print instance - asks for the ID of an instance and displays all information about the latest version of this 
instance.
- Print block - takes the block-# or the block-ID and displays all information about this block
- Attach user - add the result of [Device Add](https://demo.c4dt.org/omniledger/admin/devices) to link to a wallet

If a wallet is available, the following additional buttons are available:
- Create Calypso-Write - asks for a DarcID for the access-control, plus a string that will be encrypted.
The resulting InstanceID will be printed to the log.
- Read Calypso - asks for the InstanceID of a previous Calypso-Write instance.
A transaction to read that instance will be sent to the chain.
If the Darc in the CalypsoWrite refuses the read, an error will be produced.
- Send Coin - asks for the target CoinID and the number of coins to send.
- Create Value - asks for a DarcID for access control and the value to be stored on the chain.
If the value has been created on the chain, the InstanceID will be printed on the log.
- Update Value - asks for the InstanceID of a value instance and a new value.
If your wallet has the right to update the 
