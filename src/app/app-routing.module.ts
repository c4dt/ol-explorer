import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NewuserComponent} from "./newuser/newuser.component";
// import { ExplorerComponent } from 'src/app/explorer/explorer.component';

const routes: Routes = [
    // {path: "", redirectTo: "/exercise", pathMatch: "full"},
    {path: "newuser", component: NewuserComponent},
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
