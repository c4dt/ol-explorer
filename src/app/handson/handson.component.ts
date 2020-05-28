import {Component, OnInit} from '@angular/core';
import {ByzCoinService} from "../byz-coin.service";
import {UserService} from "../user.service";
import * as Long from "long";
import {MatDialog} from "@angular/material/dialog";
import {Calypso} from "@c4dt/dynacred-c4dt";
import {HandsonHelpers} from "./handson-helpers";
import {Coin} from "@c4dt/cothority/byzcoin/contracts";
import {Darc} from "@c4dt/cothority/darc";
import ValueInstance from "@c4dt/cothority/byzcoin/contracts/value-instance";

@Component({
    selector: 'app-handson',
    templateUrl: './handson.component.html',
    styleUrls: ['./handson.component.css']
})
export class HandsonComponent extends HandsonHelpers implements OnInit {

    constructor(
        public bcs: ByzCoinService,
        public user: UserService,
        public dialog: MatDialog,
    ) {
        super(bcs, user, dialog);
    }

    async buttonSendCoin() {
        const idStr = await this.getInput("Coin", "Address_ID");
        const value = await this.getInput("Coin", "Value");
        await this.doTx((tx) => {
            const id = Buffer.from(idStr, "hex");
            this.user.coinBS.transferCoins(tx, id, Long.fromString(value))
        });
        this.log("sent", value, "coins to", idStr);
    }

    async buttonPrintInstance() {
        const idStr = await this.getInput("Print instance", "ID");
        try {
            const id = Buffer.from(idStr, "hex");
            const inst = (await this.bcs.bc.instanceObservable(id)).getValue();
            this.logInstance(inst);
        } catch (e) {
            this.log("error:", e)
        }
    }

    async buttonCreateValue() {
        const val = await this.getInput("Value for instance", "Text");
        const did = await this.getInput("Darc-baseID for protection", "BaseID");
        await this.doTx((tx) => {
            const valID = tx.spawnValue(Buffer.from(did, "hex"), Buffer.from(val));
            this.log("Creating value", valID);
        });
    }

    async buttonUpdateValue() {
        const valID = await this.getInput("ValueID", "ID");
        const newText = await this.getInput("Value", "Text");
        await this.doTx(async (tx) => {
                tx.progress(-30, "Getting old value");
                const val = await ValueInstance.fromByzcoin(this.bcs.bc, Buffer.from(valID, "hex"));
                tx.progress(50, "Updating value");
                await val.updateValue([this.user.kiSigner], Buffer.from(newText));
            }
        )
    }

    async buttonUpdateLTS() {
        const lts = await this.bcs.retrieveLTS(this.bcs.config.ltsID);
        await this.bcs.user.executeTransactions((tx) => {
            this.bcs.user.credStructBS.credConfig.ltsID.setValue(tx, this.bcs.config.ltsID);
        }, 10);
        this.bcs.user.calypso = new Calypso(lts, this.user.credSignerBS.getValue().getBaseID(),
            this.user.credStructBS.credCalypso);
    }

    async buttonCreateWrite() {
        const secret = await this.getInput("Secret to store", "Text");
        const did = await this.getInput("Darc for protection", "BaseID");
        await this.doTx((tx) => {
            const d = Calypso.spawnDarc(tx, `CalypsoWrite at ${new Date()}`,
                Buffer.from(did, "hex"));
            const cWrite = this.user.calypso.addFile(tx, d.getBaseID(), new Date().toISOString(),
                Buffer.from(secret));
            this.log("Created CalypsoWrite", cWrite, "with darc-id", d.getBaseID());
        })
    }

    async buttonCreateRead() {
        const id = await this.getInput("CalypsoWriteID");
        await this.doTx(async (tx) => {
            const buf = await this.user.calypso.getFile(tx, Buffer.from(id, "hex"));
            this.log("Got text back:", buf.toString());
        });
    }

    async ngOnInit() {
        try {
            const sb = await this.bcs.skipchain.getSkipBlockByIndex(this.bcs.bc.genesisID, 32768);
            this.log("sb #32768", sb.skipblock);
            this.log(this.credStructToString(this.user.credStructBS));
        } catch (e) {
            this.log("Error:", e);
        }
    }
}
