import { Component, OnInit } from '@angular/core';
import {ByzCoinService} from "../byz-coin.service";
import {UserService} from "../user.service";
import {Log} from "@c4dt/cothority";
import * as Long from "long";

@Component({
  selector: 'app-handson',
  templateUrl: './handson.component.html',
  styleUrls: ['./handson.component.css']
})
export class HandsonComponent implements OnInit {
  logLines = "";

  constructor(
      public bcs: ByzCoinService,
      public user: UserService,
  ) { }

  log(...args: any){
    const bufs = args.map((a) => Buffer.isBuffer(a) ? a.toString('hex') : a);
    this.logLines += `${Log.joinArgs(bufs)}\n`
  }

  async ngOnInit() {
    this.log("Welcome user", this.user.credStructBS.credPublic.alias.getValue());
    this.log("Credits:", this.user.coinBS.getValue().value);
    await this.user.executeTransactions((tx) => this.user.coinBS.transferCoins(tx,
    Buffer.from("722b25091d1bc4466a39b238b83b199a3726f28095a09f299243e5a95a9c790d", "hex"), Long.fromNumber(100)));
  }
}
