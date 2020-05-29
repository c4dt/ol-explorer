import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NewuserComponent} from "./newuser/newuser.component";
import {HandsonComponent} from "./handson/handson.component";
// import { ExplorerComponent } from 'src/app/explorer/explorer.component';

const routes: Routes = [
    {path: "", redirectTo: "/handson", pathMatch: "full"},
    {path: "newuser", component: NewuserComponent},
    {path: "handson", component: HandsonComponent},
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
