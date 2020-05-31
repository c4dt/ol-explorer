import {Component, OnInit} from '@angular/core';
import {ByzCoinService} from "../byz-coin.service";
import {UserService} from "../user.service";
import * as Long from "long";
import {MatDialog} from "@angular/material/dialog";
import {Calypso, CalypsoData} from "@c4dt/dynacred-c4dt/index";
import {HandsonHelpers} from "src/app/handson/handson-helpers";
import {CalypsoReadInstance, CalypsoWriteInstance} from "@c4dt/cothority/calypso";
import {Instance} from "@c4dt/cothority/byzcoin";

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
        await this.doTx((tx) =>
            this.user.coinBS.transferCoins(tx,
                Buffer.from("722b25091d1bc4466a39b238b83b199a3726f28095a09f299243e5a95a9c790d", "hex"),
                Long.fromNumber(100)));
        this.log("coin sent");
    }

    async buttonUpdateLTS() {
        const lts = await this.bcs.retrieveLTS(this.bcs.config.ltsID);
        await this.bcs.user.executeTransactions((tx) => {
            this.bcs.user.credStructBS.credConfig.ltsID.setValue(tx, this.bcs.config.ltsID);
        }, 10);
        this.bcs.user.calypso = new Calypso(lts, this.user.credSignerBS.getValue().getBaseID(),
            this.user.credStructBS.credCalypso);
    }

    async buttonCreateWrite(name: string, content: string) {
        await this.doTx((tx) => {
            const d = Calypso.spawnDarc(tx, `CalypsoWrite at ${new Date()}`,
                this.user.identityDarcSigner.id);
            const cWrite = this.user.calypso.addFile(tx, d.getBaseID(), name, Buffer.from(content));
            this.log("Created CalypsoWrite", cWrite);
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
            const bcb = await this.getBCBlockIndex(54894);
            const args = bcb.body.txResults[0].clientTransaction.instructions[1].spawn.args;
            this.log(args.map((arg) => arg.name + arg.value.toString('hex')));

            const wrID = Buffer.from("26bcdda2f3f06d2ac3f6c9d1d6d69bb1ab62dff674f83cfa96cf9b3cfa8c529d", "hex");
            const preID = Buffer.from("573aaabf328daf07bfd1ad1272f8c409134070e4cfd69417dfe20008796f3ff6", "hex");
            const rdID = CalypsoReadInstance.preToInstID(preID);
            const readInst = await this.bcs.bc.instanceObservable(rdID);
            this.log(readInst.getValue().contractID);

            const wrProof = await this.bcs.bc.getProof(wrID);
            const rdProof = await this.bcs.bc.getProof(rdID);
            try {
                const xhatenc = await this.user.calypso.lts.reencryptKey(
                    wrProof,
                    rdProof,
                );
                this.log("xhatenc:", xhatenc);
            } catch(e){
                this.log("Error while re-encrypting:", e);
            }

            this.log("Welcome user", this.user.credStructBS.credPublic.alias.getValue());
            this.log("Credits:", this.user.coinBS.getValue().value);
            const someDarc = await this.getDarc("a3cbc6c20a55a46675246314950826f0e415a1d6e29aaf0651f489f07f796ac2")
            this.logDarcBS(someDarc);
            // this.logAddressBook(this.user.addressBook);
            this.log("LTS:", this.user.calypso.lts.id);
            this.log("Calypso-write:", wrID)
        } catch (e) {
            this.log("Error:", e);
        }
    }
}
