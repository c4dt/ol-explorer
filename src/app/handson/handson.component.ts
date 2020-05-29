import { Component, OnInit } from '@angular/core';
import {ByzCoinService} from "../byz-coin.service";
import {UserService} from "../user.service";
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

  log(...text: string[]){
    this.logLines += `${text.join(" ")}\n`
  }

  async ngOnInit() {
    this.log("Welcome user", this.user.credStructBS.credPublic.alias.getValue());
    // this.log("Credits:", this.user.coinBS.getValue().value);
    // await this.user.executeTransactions((tx) => this.user.coinBS.transferCoins(tx, Buffer.from("some address"), Long.fromNumber(100)));
  }
}
