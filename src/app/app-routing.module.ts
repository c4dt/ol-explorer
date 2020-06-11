import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
// import { ExplorerComponent } from './explorer/explorer.component';

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
export class AppRoutingModule {
}
