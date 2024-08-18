import {computed, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Country} from "./country.model";
import {State} from "../../../../core/model/state.model";
import {catchError, map, Observable, of, shareReplay, tap} from "rxjs";
import {environment} from "../../../../../environments/environment";

// @Injectable decorator marks this class as a service that can be injected into other components/services
@Injectable({
  providedIn: 'root'  // Provides this service at the root level, making it a singleton
})
export class CountryService {

  // Inject HttpClient service for making HTTP requests
  http = inject(HttpClient);

  // Define a writable signal to hold the state of the countries list
  private countries$: WritableSignal<State<Array<Country>>> =
    signal(State.Builder<Array<Country>>().forInit());  // Initialize the signal with a 'forInit' state

  // Define a computed signal to expose the current state of countries
  countries = computed(() => this.countries$());

  // Define an Observable to handle fetching countries
  private fetchCountry$ = new Observable<Array<Country>>();

  // Constructor initializes fetching countries and subscribes to the fetchCountry$ observable
  constructor() {
    this.initFetchGetAllCountries();  // Initialize the fetching process
    this.fetchCountry$.subscribe();   // Subscribe to the fetch observable to start the fetch operation
  }

  // Method to initialize the fetching of all countries
  initFetchGetAllCountries(): void {
    // Create an observable for fetching the countries JSON file
    this.fetchCountry$ = this.http.get<Array<Country>>(`${environment.BACKEND_URL}/assets/countries.json`)
      .pipe(
        // Use tap operator to handle the fetched countries
        tap(countries =>
          // Update the countries$ signal state to success with the fetched data
          this.countries$.set(State.Builder<Array<Country>>().forSuccess(countries))
        ),
        // Use catchError operator to handle any errors during the fetch
        catchError(err => {
          // Update the countries$ signal state to error with the error message
          this.countries$.set(State.Builder<Array<Country>>().forError(err));
          // Return an observable of the error to continue the stream
          return of(err);
        }),
        // Use shareReplay operator to cache the latest emitted value and share it with subscribers
        shareReplay(1)
      );
  }

  // Public method to get a country by its code
  public getCountryByCode(code: string): Observable<Country> {
    // Pipe through the fetchCountry$ observable to filter and find the country by code
    return this.fetchCountry$.pipe(
      // Use map operator to filter countries by the given code
      map(countries => countries.filter(country => country.cca3 === code)),
      // Use map operator to select the first (and should be only) country from the filtered result
      map(countries => countries[0])
    );
  }
}
