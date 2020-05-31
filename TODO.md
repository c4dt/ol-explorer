Different stuff to do:

* move back to @dedis/cothority and @c4dt/dynacred
* stop updating of nodes


OmniLedger:
* remove "Calypso" tab
* make sure darcs get removed from signer darc when removing device
* move lts-structure to cothority
* correct block-display in transaction-popup
* When clicking on device-darcs, the id of the darc instead of the baseID is shown


Cothority:
* Backport calypso changes from lts-roster branch
  * verifyProof needs to take the roster of the latest link in the proof
