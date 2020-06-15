import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

interface IInput {
    title: string;
    input: string;
}

@Component({
    selector: 'app-dialog-handson-input',
    templateUrl: 'input.html'
})
export class HandsonInputComponent {
    result: string;

    constructor(
        public dialogRef: MatDialogRef<HandsonInputComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IInput) {
    }
}
