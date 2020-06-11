import {ByzCoinService} from '../lib/byz-coin.service';
import {MatDialog} from '@angular/material/dialog';
import {Log} from '@dedis/cothority';
import {Calypso, SpawnerTransactionBuilder} from '@c4dt/dynacred';
import {showDialogInfo, showDialogOKC, showTransactions, TProgress} from '../lib/Ui';
import {HandsonInputComponent} from '../lib/input';
import {Coin} from '@dedis/cothority/byzcoin/contracts';
import ValueInstance from '@dedis/cothority/byzcoin/contracts/value-instance';
import * as Long from 'long';
import {SkipBlock} from '@dedis/cothority/skipchain';
import {PrettyPrint, PrettyPrintElement} from '../lib/pretty-print';
import {Darc, IdentityDarc} from "@dedis/cothority/darc";

export class HandsonHelpers {
    logLines = '';
    loading = true;
    startupLog = '';
    text: string;
    percentage: number;
    bcviewer = false;
    stackblitz = false;

    constructor(
        public bcs: ByzCoinService,
        public dialog: MatDialog,
    ) {
        this.stackblitz = window.location.hostname.includes("stackblitz.com");
    }

    log(...args: any) {
        let title = '';
        if (args.length > 1) {
            title = args.shift();
        }
        const d = new Date();
        const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
            .map((dt) => dt.toString().padStart(2, '0'))
            .join(':');
        const bufs = args.map((a) => Buffer.isBuffer(a) ? a.toString('hex') : a);
        this.logLines = `${time} -> ${title}\n${Log.joinArgs(bufs)}\n\n` + this.logLines;
    }

    logPP(pp: PrettyPrint){
        this.log(pp.title, pp.join());
    }

    logAppend(msg: string, perc: number) {
        this.startupLog += `${msg}\n`;
        this.text = msg;
        this.percentage = perc;
        Log.lvl2('UI-log:', perc, msg);
    }

    async init() {
        try {
            await this.bcs.loadConfig((msg: string, perc: number) =>
                this.logAppend(msg, perc * 0.5));

            Log.lvl2('Starting to update blocks for viewer');
            this.bcviewer = true;

            await this.bcs.loadUser((msg: string, perc: number) =>
                this.logAppend(msg, 50 + perc * 0.5));

        } catch (e) {
            Log.catch(e, 'failed loading user');
            return showDialogOKC(this.dialog, 'Error while loading', e)
        }
        this.loading = false;
    }

    async doTx(trans: (tx: SpawnerTransactionBuilder) => Promise<unknown> | void,
               title = 'Some Transaction') {
        try {
            await showTransactions(this.dialog, title,
                async (progress: TProgress) => {
                    progress(-10, 'collecting');
                    const tx = this.bcs.user.startTransaction();
                    tx.progress = progress;
                    await trans(tx);
                    if (tx.hasInstructions()) {
                        progress(50, 'Sending transaction');
                        await tx.sendCoins(10);
                    }
                });
        } catch (e) {
            this.log('Error:', e);
        }
    }

    async getInput(title: string, input = ''): Promise<string> {
        const ac = this.dialog.open(HandsonInputComponent, {
            data: {title, input},
            width: '600px',
        });
        return new Promise((resolve, reject) => {
            ac.afterClosed().subscribe(async (result) => {
                if (result !== '') {
                    resolve(result);
                } else {
                    reject('no result given');
                }
            });
        });
    }

    async showError(button: () => Promise<unknown | void>) {
        try {
            await button();
        } catch (e) {
            return showDialogInfo(this.dialog, 'Error', e, 'Too bad');
        }
    }

    async buttonAttachUser() {
        this.showError(async () => {
            const url = await this.getInput('User-URL', 'Device URL');

            await showTransactions(this.dialog, 'Attaching to existing user',
                async (progress: TProgress) => {
                    progress(-30, 'Downloading data of user');
                    this.bcs.user = await this.bcs.retrieveUserByURL(url);

                    progress(70, 'Updating LTSID');
                    await this.bcs.user.executeTransactions((tx) => {
                        this.bcs.user.credStructBS.credConfig.ltsID.setValue(tx, this.bcs.config.ltsID);
                    }, 10);
                });
            return window.location.reload();
        });
    }

    async buttonSendCoin() {
        this.showError(async () => {
            const idStr = await this.getInput('Coin', 'Address_ID');
            const value = await this.getInput('Coin', 'Value');
            await this.doTx((tx) => {
                const id = Buffer.from(idStr, 'hex');
                this.bcs.user.coinBS.transferCoins(tx, id, Long.fromString(value))
            });
            this.log('sent', value, 'coins to', idStr);
        });
    }

    async buttonPrintInstance() {
        this.showError(async () => {
            const idStr = await this.getInput('Print instance', 'ID');
            try {
                const id = Buffer.from(idStr, 'hex');
                const pr = (await this.bcs.bc.instanceObservable(id)).getValue();
                this.logPP(PrettyPrintElement.proof(pr));
            } catch (e) {
                this.log('error:', e)
            }
        });
    }

    async buttonPrintBlock() {
        this.showError(async () => {
            const sbID = await this.getInput('Block', 'ID or block-#');
            let sb: SkipBlock;
            if (sbID.length === 64) {
                sb = await this.bcs.skipchain.getSkipBlock(Buffer.from(sbID, 'hex'));
            } else {
                const reply = await this.bcs.skipchain.getSkipBlockByIndex(this.bcs.bc.genesisID, parseInt(sbID));
                sb = reply.skipblock;
            }
            this.logPP(PrettyPrintElement.skipBlock(sb));
        });
    }

    async buttonCreateValue() {
        this.showError(async () => {
            const val = await this.getInput('Value for instance', 'Text');
            if (val === undefined || val === ""){
                return;
            }
            const did = await this.getInput('Darc-baseID for protection', 'BaseID');
            if (did === "" || Buffer.from(did, 'hex').length != 32){
                throw new Error("not a valid ID");
            }
            await this.doTx((tx) => {
                const id = new IdentityDarc({id: Buffer.from(did, 'hex')});
                const d = Darc.createBasic([id], [id], Buffer.from("Value Darc"),
                    [`invoke:${ValueInstance.contractID}.${ValueInstance.commandUpdate}`]);
                tx.spawnDarc(d);
                const valID = tx.spawnValue(d.getBaseID(), Buffer.from(val));
                this.log('Creating value', valID);
            });
        });
    }

    async buttonUpdateValue() {
        this.showError(async () => {
            const valID = await this.getInput('ValueID', 'ID');
            const newText = await this.getInput('Value', 'Text');
            await this.doTx(async (tx) => {
                    tx.progress(-30, 'Getting old value');
                    const val = await ValueInstance.fromByzcoin(this.bcs.bc, Buffer.from(valID, 'hex'));
                    tx.progress(50, 'Updating value');
                    await val.updateValue([this.bcs.user.kiSigner], Buffer.from(newText));
                }
            )
        });
    }

    async buttonUpdateLTS() {
        this.showError(async () => {
            const lts = await this.bcs.retrieveLTS(this.bcs.config.ltsID);
            await this.bcs.user.executeTransactions((tx) => {
                this.bcs.user.credStructBS.credConfig.ltsID.setValue(tx, this.bcs.config.ltsID);
            }, 10);
            this.bcs.user.calypso = new Calypso(lts, this.bcs.user.credSignerBS.getValue().getBaseID(),
                this.bcs.user.credStructBS.credCalypso);
        });
    }

    async buttonCreateWrite() {
        this.showError(async () => {
            const secret = await this.getInput('Secret to store', 'Text');
            const did = await this.getInput('Darc for protection', 'BaseID');
            await this.doTx((tx) => {
                const d = Calypso.spawnDarc(tx, `CalypsoWrite at ${new Date()}`,
                    Buffer.from(did, 'hex'));
                const cWrite = this.bcs.user.calypso.addFile(tx, d.getBaseID(), new Date().toISOString(),
                    Buffer.from(secret));
                this.log('Created CalypsoWrite', cWrite, 'with darc-id', d.getBaseID());
            })
        });
    }

    async buttonCreateRead() {
        this.showError(async () => {
            const id = await this.getInput('CalypsoWriteID');
            await this.doTx(async (tx) => {
                const buf = await this.bcs.user.calypso.getFile(tx, Buffer.from(id, 'hex'));
                this.log('Got text back:', buf.toString());
            });
        });
    }
}
