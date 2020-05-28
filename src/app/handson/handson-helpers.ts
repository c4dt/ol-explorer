import {ByzCoinService} from "../byz-coin.service";
import {UserService} from "../user.service";
import {MatDialog} from "@angular/material/dialog";
import {Log} from "@c4dt/cothority";
import {AddressBook, byzcoin} from "@c4dt/dynacred-c4dt";
import {Darc} from "@c4dt/cothority/darc";
import {SpawnerTransactionBuilder} from "@c4dt/dynacred-c4dt";
import {showTransactions, TProgress} from "../../lib/Ui";
import {HandsonInputComponent} from "./input";
import {BCBlock} from "../bcviewer/bcviewer.component";
import {Proof} from "@c4dt/cothority/byzcoin";
import {Coin, CoinInstance, CredentialsInstance, DarcInstance} from "@c4dt/cothority/byzcoin/contracts";
import {CalypsoReadInstance, CalypsoWriteInstance, Read, Write} from "@c4dt/cothority/calypso";
import {CredentialStruct} from "@c4dt/cothority/personhood/credentials-instance";
import ValueInstance from "@c4dt/cothority/byzcoin/contracts/value-instance";
import {CredentialStructBS} from "@c4dt/dynacred-c4dt";
import {BehaviorSubject} from "rxjs";

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
        const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
            .map((dt) => dt.toString().padStart(2, '0'))
            .join(":");
        const bufs = args.map((a) => Buffer.isBuffer(a) ? a.toString('hex') : a);
        this.logLines = `${time} ->\n${Log.joinArgs(bufs)}\n\n` + this.logLines;
    }

    logDarcBS(dbs: byzcoin.DarcBS) {
        const d = dbs.getValue();
        const rules = d.rules.list.map((r) => `${r.action.toUpperCase()} = ${r.getExpr()}`).join("\n");
        this.log(`Description: ${d.description}\n${rules}`);
    }

    logAddressBook(ab: AddressBook) {
        this.log(ab.contacts.getValue().map(
            (c) => c.credPublic.alias.getValue() + " : " + c.id.toString('hex'))
            .join("\n"));
    }

    logInstance(pr: Proof) {
        const headers = [`Contract: ${pr.contractID}`,
            `DARC: ${pr.darcID.toString('hex')}`,
            `Version: ${pr.stateChangeBody.version}`];
        const content: string[] = [];
        switch (pr.contractID) {
            case DarcInstance.contractID:
                const d = Darc.decode(pr.value);
                const rules = d.rules.list.map((r) => `  ${r.action.toUpperCase()} = ${r.getExpr()}`);
                content.push(`Description: ${d.description}`, `Version: ${d.version}`, `Rules:`, ...rules);
                break;
            case CalypsoWriteInstance.contractID:
                const wr = Write.decode(pr.value);
                content.push(`ExtraData: ${wr.extradata.toString('hex')}`,
                    `LTSID: ${wr.ltsid.toString('hex')}`);
                if (wr.cost){
                    content.push(`cost: ${wr.cost.value}`);
                }
                break;
            case CalypsoReadInstance.contractID:
                const rd = Read.decode(pr.value);
                content.push(`CalypsoWriteID: ${rd.write}`);
                break;
            case ValueInstance.contractID:
                const txt = Buffer.toString().replace(/\W/g, '.');
                content.push(`Text: ${txt}`);
                break;
            case CoinInstance.contractID:
                const c = Coin.decode(pr.value);
                content.push(`Name: ${c.name.toString()}`,
                    `Value: ${c.value.toString()}`);
                break;
            case CredentialsInstance.contractID:
                const cred = CredentialStruct.decode(pr.value);
                const credMap = this.credStructToMap(new CredentialStructBS(pr.key, pr.darcID,
                    new BehaviorSubject<CredentialStruct>(cred)));
                credMap.forEach((v, k) => content.push(`${k}:\n  ${v.join('\n  ')}`));
                break;
        }
        this.log(`Instance ID: ${pr.key.toString('hex')}\n `, headers.join("\n  "),
            `\n  Content:\n   `, content.join("\n    "));
    }

    credStructToString(cred: CredentialStructBS): string{
        const m = this.credStructToMap(cred);
        const content: string[] = [];
        m.forEach((v, k) => content.push(`${k}:\n  ${v.join('\n  ')}`));
        return content.join("\n");
    }

    credStructToMap(cred: CredentialStructBS): Map<string, string[]> {
        const m = new Map<string, string[]>();
        const pub = cred.credPublic;
        m.set('Public', [
            `Alias: ${pub.alias.getValue()}`,
            `Email: ${pub.email.getValue()}`,
            `CoinID: ${pub.coinID.getValue().toString('hex')}`,
            `Phone: ${pub.phone.getValue()}`,
            `URL: ${pub.url.getValue()}`,
            `Version: ${pub.version.getValue()}`,
            `Contacts: ${pub.contacts.getValue().toInstanceIDs().map((gr) => gr.toString('hex')).join(' :: ')}`,
            `Groups: ${pub.groups.getValue().toInstanceIDs().map((gr) => gr.toString('hex')).join(' :: ')}`,
            `Actions: ${pub.actions.getValue().toInstanceIDs().map((gr) => gr.toString('hex')).join(' :: ')}`,
        ]);
        const conf = cred.credConfig;
        m.set('Config', [
            `View: ${conf.view.getValue()}`,
            `SpawnerID: ${conf.spawnerID.getValue().toString('hex')}`,
            `StructVersion: ${conf.structVersion.getValue()}`,
            `LTSID: ${conf.ltsID.getValue().toString('hex')}`
        ]);
        m.set('Devices', cred.credDevices.getValue().toKVs().map((kv) => `${kv.value}: ${kv.key.toString('hex')}`))
        m.set('Recoveries', cred.credRecoveries.getValue().toKVs().map((kv) => `${kv.value}: ${kv.key.toString('hex')}`))
        m.set('Calypso', cred.credCalypso.getValue().toKVs().map((kv) => `${kv.value}: ${kv.key.toString('hex')}`))
        return m;
    }

    darcToHtml(d: Darc): string {
        const rules = d.rules.list.map((r) => `<strong>${r.action}</strong> = ${r.getExpr()}`).join("</li><li>");
        return `<ul><li>${rules}</li></ul>`;
    }

    async getDarc(hex: string): Promise<byzcoin.DarcBS> {
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
                    if (tx.hasInstructions()) {
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
            ac.afterClosed().subscribe(async (result) => {
                if (result !== "") {
                    resolve(result);
                } else {
                    reject("no result given");
                }
            });
        });
    }
}

