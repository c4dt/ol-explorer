import {ByzCoinService} from "../byz-coin.service";
import {UserService} from "../user.service";
import {MatDialog} from "@angular/material/dialog";
import {Log} from "@c4dt/cothority/index";
import {DarcBS} from "@c4dt/dynacred-c4dt/byzcoin";
import {AddressBook} from "@c4dt/dynacred-c4dt/addressBook";
import {Darc} from "@c4dt/cothority/darc";
import {SpawnerTransactionBuilder} from "@c4dt/dynacred-c4dt/spawnerTransactionBuilder";
import {showTransactions, TProgress} from "../../lib/Ui";
import {HandsonInputComponent} from "./input";
import {BCBlock} from "../bcviewer/bcviewer.component";

export class HandsonHelpers {
    logLines = "";

    constructor(
        public bcs: ByzCoinService,
        public user: UserService,
        public dialog: MatDialog,
    ) {
    }

    log(...args: any) {
        const d = new Date();
        this.logLines += [d.getHours(), d.getMinutes(), d.getSeconds()].join(":") + " ->\n";
        const bufs = args.map((a) => Buffer.isBuffer(a) ? a.toString('hex') : a);
        this.logLines += `${Log.joinArgs(bufs)}\n\n`
    }

    logDarcBS(dbs: DarcBS) {
        const d = dbs.getValue();
        const rules = d.rules.list.map((r) => `${r.action.toUpperCase()} = ${r.getExpr()}`).join("\n");
        this.log(`Description: ${d.description}\n${rules}`);
    }

    logAddressBook(ab: AddressBook) {
        this.log(ab.contacts.getValue().map(
            (c) => c.credPublic.alias.getValue() + " : " + c.id.toString('hex'))
            .join("\n"));
    }

    darcToHtml(d: Darc): string {
        const rules = d.rules.list.map((r) => `<strong>${r.action}</strong> = ${r.getExpr()}`).join("</li><li>");
        return `<ul><li>${rules}</li></ul>`;
    }

    async getDarc(hex: string): Promise<DarcBS> {
        return this.bcs.retrieveDarcBS(Buffer.from(hex, "hex"));
    }

    async doTx(trans: (tx: SpawnerTransactionBuilder) => Promise<unknown> | void,
               title = "Some Transaction") {
        try {
            await showTransactions(this.dialog, title,
                async (progress: TProgress) => {
                    progress(-10, "collecting");
                    const tx = this.user.startTransaction();
                    tx.progress = progress;
                    await trans(tx);
                    if (tx.hasInstructions()){
                        progress(50, "Sending transaction");
                        await tx.sendCoins(10);
                    }
                });
        } catch (e) {
            this.log("Error:", e);
        }
    }

    async getBCBlockIndex(index: number): Promise<BCBlock> {
        const sbReply = await this.bcs.skipchain.getSkipBlockByIndex(this.bcs.bc.genesisID, index);
        return new BCBlock(this.bcs.skipchain, sbReply.skipblock);
    }

    async getInput(title: string, input = ""): Promise<string> {
        const ac = this.dialog.open(HandsonInputComponent, {
            data: {title, input},
            width: '600px',
        });
        return new Promise((resolve, reject) => {
            ac.afterClosed().subscribe(async (input) => {
                if (input !== "") {
                    resolve(input);
                } else {
                    reject("no input given");
                }
            });
        });
    }
}

