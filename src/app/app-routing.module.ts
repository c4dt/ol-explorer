import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// import { ExplorerComponent } from 'src/app/explorer/explorer.component';

const routes: Routes = [
  // {
  //   tslint:disable-next-line
    // path: "explorer/:id", component: ExplorerComponent
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
