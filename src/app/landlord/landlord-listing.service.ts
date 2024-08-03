import {computed, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {CardListing, CreatedListing, NewListing} from "./model/listing.model";
import {State} from "../core/model/state.model";
import {environment} from "../../environments/environment";

// The Injectable decorator marks this class as a service that can be injected into other components or services.
@Injectable({
  providedIn: 'root'
})
export class LandlordListingService {

  // Injecting the HttpClient service for making HTTP requests.
  http = inject(HttpClient);

  // WritableSignal to hold the state of the create operation.
  private create$: WritableSignal<State<CreatedListing>> = signal(State.Builder<CreatedListing>().forInit());

  // Computed signal to expose the create state.
  createSig = computed(() => this.create$());

  // WritableSignal to hold the state of the getAll operation.
  private getAll$: WritableSignal<State<Array<CardListing>>> = signal(State.Builder<Array<CardListing>>().forInit());

  // Computed signal to expose the getAll state.
  getAllSig = computed(() => this.getAll$());

  // WritableSignal to hold the state of the delete operation.
  private delete$: WritableSignal<State<string>> = signal(State.Builder<string>().forInit());

  // Computed signal to expose the delete state.
  deleteSig = computed(() => this.delete$());

  /**
   * Creates a new listing.
   * @param newListing - The new listing data.
   */
  create(newListing: NewListing): void {
    // Create a new FormData object to hold the listing data and pictures.
    const formData = new FormData();

    // Append each picture file to the FormData object.
    for (let i = 0; i < newListing.pictures.length; ++i) {
      formData.append("picture-" + i, newListing.pictures[i].file);
    }

    // Clone the new listing object to modify it without affecting the original.
    const clone = structuredClone(newListing);

    // Remove pictures from the clone as they are already appended to the FormData.
    clone.pictures = [];

    // Append the serialized new listing object to the FormData.
    formData.append("dto", JSON.stringify(clone));

    // Make an HTTP POST request to create the new listing.
    this.http.post<CreatedListing>(`${environment.API_URL}/landlord-listing/create`, formData).subscribe({

      // On success, update the create signal with the created listing data.
      next: listing => this.create$.set(State.Builder<CreatedListing>().forSuccess(listing)),

      // On error, update the create signal with the error information.
      error: err => this.create$.set(State.Builder<CreatedListing>().forError(err)),
    });
  }

  /**
   * Resets the state of the listing creation operation.
   */
  resetListingCreation(): void {
    // Reset the create signal to its initial state.
    this.create$.set(State.Builder<CreatedListing>().forInit());
  }

  /**
   * Retrieves all listings.
   */
  getAll(): void {
    // Make an HTTP GET request to retrieve all listings.
    this.http.get<Array<CardListing>>(`${environment.API_URL}/landlord-listing/get-all`).subscribe({

      // On success, update the getAll signal with the retrieved listings data.
      next: listings => this.getAll$.set(State.Builder<Array<CardListing>>().forSuccess(listings)),

      // On error, update the create signal with the error information.
      error: err => this.create$.set(State.Builder<CreatedListing>().forError(err)),
    });
  }

  /**
   * Deletes a listing by its public ID.
   * @param publicId - The public ID of the listing to be deleted.
   */
  delete(publicId: string): void {
    // Create HTTP parameters with the public ID of the listing to be deleted.
    const params = new HttpParams().set("publicId", publicId);
    // Make an HTTP DELETE request to delete the listing.
    this.http.delete<string>(`${environment.API_URL}/landlord-listing/delete`, {params}).subscribe({

      // On success, update the delete signal with the deleted public ID.
      next: publicId => this.delete$.set(State.Builder<string>().forSuccess(publicId)),

      // On error, update the create signal with the error information.
      error: err => this.create$.set(State.Builder<CreatedListing>().forError(err)),
    });
  }

  /**
   * Resets the state of the delete operation.
   */
  resetDelete(): void {
    // Reset the delete signal to its initial state.
    this.delete$.set(State.Builder<string>().forInit());
  }
}
