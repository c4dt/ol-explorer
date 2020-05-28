import { Component, OnInit } from "@angular/core";
import {Router} from "@angular/router";
import {ByzCoinService} from "../byz-coin.service";

@Component({
  selector: "app-newuser",
  templateUrl: "./newuser.component.html",
})
export class NewuserComponent {
  constructor(bcs: ByzCoinService,
              private router: Router,
  ){
    if (bcs.hasUser()){
      router.navigate(['/handson']);
    }
  }
}
