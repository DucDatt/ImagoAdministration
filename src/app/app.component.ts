import { Component, OnInit } from '@angular/core';
import { SharedModule } from './shared/shared.module';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthState } from './ngrx/auth/auth.state';
import * as AuthActions from './ngrx/auth/auth.action';
import {AuthModel} from "./models/auth.model";
import {LoadingComponent} from "./pages/loading/loading.component";
import { Subscription, combineLatest } from 'rxjs';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SharedModule, NavbarComponent, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent  {
  title = 'Imago Admin';
  subscriptions: Subscription[] = [];
  idToken$ = this.store.select('auth', 'idToken');
  uid$ = this.store.select('auth', 'uid');

  constructor(
    private auth: Auth,
    private router: Router,
    private store: Store<{
      auth: AuthState;
    }>
  )
  {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        let idToken = await user!.getIdToken(true);
        this.store.dispatch(AuthActions.storedIdToken({ idToken }));
        this.store.dispatch(AuthActions.storedUserUid({ uid: user.uid }));
          this.router.navigateByUrl('/loading');
      } else {
        console.log('User is signed out');
        this.router.navigateByUrl('/login');
      }
    });
}

ngOnDestroy(): void {
  this.subscriptions.forEach((val) => {
    val.unsubscribe();
  });
}
ngOnInit(): void {
    this.subscriptions.push(
      combineLatest({
        idToken: this.idToken$,
        uid: this.uid$,
      }).subscribe(async (res) => {
         if(res.idToken && res.uid){
         await this.store.dispatch(AuthActions.getAuthById({
            token: res.idToken,
            id: res.uid
          }))
      }
    }),
      this.store.select('auth', 'authDetail').subscribe((val) => {
        if(val.id != undefined && val.id != ''){    
          if(val.role == 'admin'){
            this.router.navigate(['/dashboard']);
          }else{
            alert('You are not admin');
            this.router.navigate(['/login']);
          }
        }
      })
    );

}


}
