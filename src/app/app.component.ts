import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Router} from '@angular/router';

import {IdentityWrapper} from '@c4dt/cothority/darc';
import {Log} from '@c4dt/cothority';

import {ByzCoinService} from './byz-coin.service';
import {showDialogOKC, showTransactions, TProgress} from '../lib/Ui';

// deviceURL - create a new device in https://demo.c4dt.org/omniledger/admin/device and copy
// it here.
let deviceURL = "";

@Component({
    selector: 'app-root',
    styleUrls: ['./app.component.css'],
    templateUrl: './app.component.html',
})

export class AppComponent implements OnInit {
    loading = true;
    log = '';
    text: string;
    percentage: number;
    bcviewer = false;
    version = 'unknown';

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private bcs: ByzCoinService,
    ) {
        Log.lvl = 2;
    }

    logAppend(msg: string, perc: number) {
        this.log += `${msg}\n`;
        this.text = msg;
        this.percentage = perc;
        Log.lvl2('UI-log:', perc, msg);
    }

    async ngOnInit() {
        await this.bcs.loadConfig((msg: string, perc: number) => {
            this.logAppend(msg, perc * 0.8);
        });

        if (window.location.pathname.match(/\/explorer\//)) {
            Log.lvl2('using explorer - don\'t load user');
            this.loading = false;
            return;
        }

        Log.lvl2('Starting to update blocks for viewer');
        this.bcviewer = true;

        this.logAppend('Checking if user exists', 20);
        if (!(await this.bcs.hasUser())) {
            Log.print("no user");
            if (deviceURL === "") {
                Log.print("show new user");
                return this.newUser();
            } else {
                await showTransactions(this.dialog, "Attaching to existing user",
                    async (progress: TProgress) => {
                        Log.lvl = 5;
                        progress(50, "Attaching new device");
                        this.bcs.user = await this.bcs.retrieveUserByURL(deviceURL);
                    });
                return this.router.navigate(["/handson"]);
            }
        } else {
            try {
                this.logAppend('Loading data', 80);
                await this.bcs.loadUser();
                const signerDarc = await this.bcs.user.identityDarcSigner;
                const rules = await this.bcs.bc.checkAuthorization(this.bcs.bc.genesisID, signerDarc.id,
                    IdentityWrapper.fromIdentity(this.bcs.user.kiSigner));
                if (rules.length === 0) {
                    await this.bcs.user.clearDB();
                    await showDialogOKC(this.dialog, 'Device revoked', 'Sorry, but this device has been revoked.' +
                        ' If you want to use it again, you\'ll have to re-activate it.');
                    return this.newUser();
                }
                this.logAppend('Done', 100);
                this.loading = false;
            } catch (e) {
                Log.catch(e, 'failed loading user');
                // Data was here, but loading failed afterward - might be a network failure.
                const fileDialog = this.dialog.open(RetryLoadComponent, {
                    width: '300px',
                });
                fileDialog.afterClosed().subscribe(async (result: boolean) => {
                    if (result) {
                        window.location.reload();
                    } else {
                        this.loading = false;
                        return this.newUser();
                    }
                });
            }
        }
    }

    async newUser(): Promise<boolean> {
        this.loading = false;
        return this.router.navigate(['/newuser']);
    }
}

@Component({
    selector: 'app-retry-load',
    templateUrl: 'retry-load.html',
})
export class RetryLoadComponent {
    constructor(
        public dialogRef: MatDialogRef<RetryLoadComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }
}
