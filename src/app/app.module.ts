import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, RetryLoadComponent } from './app.component';
import { BcviewerComponent, ShowBlockComponent } from './bcviewer/bcviewer.component';
import { DialogOKCancelComponent } from '../lib/Ui';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { DemoMaterialModule } from '../material-module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DialogTransactionComponent } from '../lib/dialog-transaction';
import {NewuserComponent} from "./newuser/newuser.component";
import { HandsonComponent } from './handson/handson.component';

@NgModule({
  declarations: [
    AppComponent,
    BcviewerComponent,
      ShowBlockComponent,
      DialogOKCancelComponent,
      RetryLoadComponent,
      DialogTransactionComponent,
      NewuserComponent,
      HandsonComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    DemoMaterialModule,
    FormsModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  entryComponents: [
    ShowBlockComponent,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
