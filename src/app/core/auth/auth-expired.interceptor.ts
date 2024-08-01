import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "./auth.service";
import { tap } from "rxjs";

// An HTTP interceptor function to handle authentication expiration.
export const authExpired: HttpInterceptorFn = (
  req: HttpRequest<unknown>, // The outgoing HTTP request.
  next: HttpHandlerFn // The next handler in the HTTP request pipeline.
) => {
  const authService = inject(AuthService); // Inject the AuthService to access authentication methods.

  // Pass the request to the next handler and tap into the response to handle errors.
  return next(req).pipe(
    tap({
      // Error handling logic.
      error: (err: HttpErrorResponse) => {
        // Check if the error status is 401 (Unauthorized) and the URL is not for the authentication API.
        // Also, ensure the user is considered authenticated.
        if (err.status === 401 && err.url && !err.url.includes("api/auth") && authService.isAuthenticated()) {
          authService.login(); // Redirect to the login page if the authentication is expired.
        }
      }
    })
  );
};
