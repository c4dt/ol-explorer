import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BcviewerComponent } from './bcviewer/bcviewer.component';
import { ExplorerComponent } from 'src/app/explorer/explorer.component';

@NgModule({
  declarations: [
    AppComponent,
    BcviewerComponent,
      ExplorerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
