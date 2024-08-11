import {computed, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {CardListing, Listing} from "../landlord/model/listing.model";
import {State} from "../core/model/state.model";
import {createPaginationOption, Page, Pagination} from "../core/model/request.model";
import {CategoryName} from "../layout/navbar/category/category.model";
import {environment} from "../../environments/environment";
import {Subject} from "rxjs";
import {Search} from "./search/search.model";
// import {Search} from "./search/search.model";

@Injectable({
  providedIn: 'root'
})
export class TenantListingService {

  http = inject(HttpClient);

  // WritableSignal to manage the state for fetching listings by category
  private getAllByCategory$: WritableSignal<State<Page<CardListing>>>
    = signal(State.Builder<Page<CardListing>>().forInit())

  // Computed signal to expose the current state of fetching listings by category
  getAllByCategorySig = computed(() => this.getAllByCategory$());

  // WritableSignal to manage the state for fetching a single listing by public ID
  private getOneByPublicId$: WritableSignal<State<Listing>>
    = signal(State.Builder<Listing>().forInit())

  // Computed signal to expose the current state of fetching a single listing by public ID
  getOneByPublicIdSig = computed(() => this.getOneByPublicId$());

  // Subject to handle the state of search results for listings
  private search$: Subject<State<Page<CardListing>>> =
    new Subject<State<Page<CardListing>>>();
  search = this.search$.asObservable();

  // Method to fetch all listings by category with pagination support
  getAllByCategory(pageRequest: Pagination, category: CategoryName) : void {
    // Creating HTTP parameters from the pagination options
    let params = createPaginationOption(pageRequest);

    // Adding the category parameter to the request
    params = params.set("category", category);

    // Making an HTTP GET request to fetch listings by category
    this.http.get<Page<CardListing>>(`${environment.API_URL}/tenant-listing/get-all-by-category`, {params})
      .subscribe({

        // On success, update the signal with the fetched data
        next: displayListingCards =>
          this.getAllByCategory$.set(State.Builder<Page<CardListing>>().forSuccess(displayListingCards)),

        // On error, update the signal with the error
        error: error => this.getAllByCategory$.set(State.Builder<Page<CardListing>>().forError(error))
      })
  }

  // Method to reset the state of fetching listings by category to its initial state
  resetGetAllCategory(): void {
    this.getAllByCategory$.set(State.Builder<Page<CardListing>>().forInit())
  }

  // Method to fetch a single listing by its public ID
  getOneByPublicId(publicId: string): void {

    // Creating HTTP parameters with the public ID
    const params = new HttpParams().set("publicId", publicId);

    // Making an HTTP GET request to fetch a listing by its public ID
    this.http.get<Listing>(`${environment.API_URL}/tenant-listing/get-one`, {params})
      .subscribe({
        // On success, update the signal with the fetched listing
        next: listing => this.getOneByPublicId$.set(State.Builder<Listing>().forSuccess(listing)),

        // On error, update the signal with the error
        error: err => this.getOneByPublicId$.set(State.Builder<Listing>().forError(err)),
      });
  }

  // Method to reset the state of fetching a single listing by public ID to its initial state
  resetGetOneByPublicId(): void {
    this.getOneByPublicId$.set(State.Builder<Listing>().forInit())
  }

  //Method to search for listings based on a search object and pagination
  searchListing(newSearch: Search, pageRequest: Pagination): void {
    const params = createPaginationOption(pageRequest);
    this.http.post<Page<CardListing>>(`${environment.API_URL}/tenant-listing/search`, newSearch, {params})
      .subscribe({
        next: displayListingCards => this.search$.next(State.Builder<Page<CardListing>>().forSuccess(displayListingCards)),
        error: err => this.search$.next(State.Builder<Page<CardListing>>().forError(err))
      })
  }
}
