import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {Log} from '@dedis/cothority';

import {ByzCoinService} from '../lib/byz-coin.service';
import {HandsonHelpers} from './handson-helpers';
import {PrettyPrintElement, PrettyPrintInstance} from '../lib/pretty-print';
import {randomBytes} from "crypto-browserify";

@Component({
    selector: 'app-root',
    styleUrls: ['./app.component.css'],
    templateUrl: './app.component.html',
})

export class AppComponent extends HandsonHelpers implements OnInit {
    version = '1.0.0';

    constructor(
        router: Router,
        dialog: MatDialog,
        bcs: ByzCoinService,
    ) {
        super(bcs, dialog);
        Log.lvl = 2;
    }

    async ngOnInit() {
        await this.init();

        Log.print(randomBytes(32));

        return this.showError(async () => {
            this.logPP(PrettyPrintElement.skipBlock(this.bcs.bc.latest));
            if (this.bcs.user) {
                this.logPP(PrettyPrintInstance.credStruct(this.bcs.user.credStructBS.getValue()));
            }
        });
    }
}
