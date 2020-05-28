Different stuff to do:

* stackblitz: speed up loading of first block

OmniLedger:

Afterwards:
* move back to @dedis/cothority and @c4dt/dynacred
o stop updating of nodes
o stackblitz: import @c4dt/cothority long sprintf-js protobufjs toml string_decoder events vm
o decoding of instanceID


OmniLedger:
* make sure darcs get removed from signer darc when removing device
o When clicking on device-darcs, the id of the darc instead of the baseID is shown
o remove "Calypso" tab
o move lts-structure to cothority
o correct block-display in transaction-popup


Cothority:
* Backport calypso changes from lts-roster branch
* verifyProof needs to take the roster of the latest link in the proof
