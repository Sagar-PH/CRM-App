import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

const routes: Routes = [
    {
        path: 'create',
        loadComponent: ()=>
            import('./create/create.component')
                .then(c => c.CreateComponent)
    }, 
    {
        path: 'view',
        loadComponent: ()=>
            import('./view/view.component')
                .then(c => c.ViewComponent)
    }, 
    {
        path: 'edit/:id',
        loadComponent: () => 
            import('./edit/edit.component')
                .then(c => c.EditComponent)
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class CustomerRouterModule { }