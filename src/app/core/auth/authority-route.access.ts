import {ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot} from "@angular/router";
import {inject} from "@angular/core";
import {AuthService} from "./auth.service";
import {map} from "rxjs";

export const authorityRouteAccess: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);

  // Call 'fetchHttpUser' from AuthService to get the currently connected user.
  return authService.fetchHttpUser(false).pipe(
    // Use the 'map' operator to transform the observable value.
    map(connectedUser => {
      if (connectedUser) { // Check if the user is connected (authenticated).
        const authorities = next.data['authorities']; // Extract required authorities from route data.

        // If there are no required authorities, or the user has the required authorities, grant access.
        return !authorities || authorities.length === 0 || authService.hasAnyAuthority(authorities);
      }
      // If the user is not authenticated, initiate the login process.
      authService.login();
      return false; // Deny access.
    })
  );
}
