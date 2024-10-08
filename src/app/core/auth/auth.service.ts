import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpParams, HttpStatusCode } from '@angular/common/http';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';
import { State } from '../model/state.model';
import { User } from '../model/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root' // Service is provided at the root level, making it a singleton.
})
export class AuthService {

  http = inject(HttpClient); // Inject HttpClient for making HTTP requests.
  location = inject(Location); // Inject Location for URL manipulation.

  notConnected = 'NOT_CONNECTED'; // Constant to represent a user who is not connected.

  // Signal to hold the state of the fetched user, initially indicating no user is connected.
  private fetchUser$: WritableSignal<State<User>> =
    signal(State.Builder<User>().forSuccess({ email: this.notConnected }));
  fetchUser = computed(() => this.fetchUser$()); // Computed signal to access the current state of fetchUser$.

  /**
   * Fetch the authenticated user's data from the server.
   * @param forceResync - Force resynchronization with the server.
   */
  fetch(forceResync: boolean): void {
    this.fetchHttpUser(forceResync).subscribe({
      next: user => this.fetchUser$.set(State.Builder<User>().forSuccess(user)), // Update fetchUser$ with the fetched user data.
      error: err => {
        if (err.status === HttpStatusCode.Unauthorized && this.isAuthenticated()) {
          // If unauthorized and user is considered authenticated, set the user state to not connected.
          this.fetchUser$.set(State.Builder<User>().forSuccess({ email: this.notConnected }));
        } else {
          // For other errors, set the user state to an error state.
          this.fetchUser$.set(State.Builder<User>().forError(err));
        }
      }
    });
  }

  /**
   * Redirect the user to the OAuth2 login URL.
   */
  login(): void {
    location.href = `${location.origin}${this.location.prepareExternalUrl('oauth2/authorization/okta')}`;
  }

  /**
   * Log the user out by calling the logout endpoint and updating the user state.
   */
  logout(): void {
    this.http.post(`${environment.API_URL}/auth/logout`, {}).subscribe({
      next: (response: any) => {
        this.fetchUser$.set(State.Builder<User>().forSuccess({ email: this.notConnected })); // Update user state to not connected.
        location.href = response.logoutUrl; // Redirect to log out URL.
      }
    });
  }

  /**
   * Check if the user is authenticated.
   * @returns True if the user is authenticated, otherwise false.
   */
  isAuthenticated(): boolean {
    const userState = this.fetchUser$().value;
    return userState ? userState.email !== this.notConnected : false;
  }

  /**
   * Fetch the authenticated user's data from the server.
   * @param forceResync - Force resynchronization with the server.
   * @returns An observable emitting the user data.
   */
  fetchHttpUser(forceResync: boolean): Observable<User> {
    const params = new HttpParams().set('forceResync', forceResync); // Set forceResync parameter for the HTTP request.
    return this.http.get<User>(`${environment.API_URL}/auth/get-authenticated-user`, { params }); // Make GET request to fetch user data.
  }

  /**
   * Check if the user has any of the specified authorities.
   * @param authorities - Single authority or an array of authorities to check.
   * @returns True if the user has any of the specified authorities, otherwise false.
   */
  hasAnyAuthority(authorities: string[] | string): boolean {
    const userState = this.fetchUser$().value;
    if (userState!.email === this.notConnected) return false; // If the user is not connected, return false.
    if (!Array.isArray(authorities)) authorities = [authorities]; // Convert to array if not already.
    return userState!.authorities!.some(authority => authorities.includes(authority));
  }
}
