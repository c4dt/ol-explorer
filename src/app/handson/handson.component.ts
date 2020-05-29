import { Component, OnInit } from '@angular/core';
import {ByzCoinService} from "../byz-coin.service";
import {UserService} from "../user.service";

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

  ngOnInit(): void {
    this.log("Welcome user", this.user.credStructBS.credPublic.alias.getValue());
  }
}
