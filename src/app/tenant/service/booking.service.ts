import {computed, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {State} from "../../core/model/state.model";
import {BookedDatesDTOFromClient, BookedDatesDTOFromServer, BookedListing, CreateBooking} from "../model/booking.model";
import {environment} from "../../../environments/environment";
import {HttpClient, HttpParams} from "@angular/common/http";
import {map} from "rxjs";
import dayjs from "dayjs";

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private http = inject(HttpClient);

  // A writable signal to store the state of the create booking process
  private createBooking$: WritableSignal<State<boolean>>
    = signal(State.Builder<boolean>().forInit())

  // A computed signal to expose the current value of createBooking$
  createBookingSig = computed(() => this.createBooking$());

  // A writable signal to store the state of the check availability process
  private checkAvailability$: WritableSignal<State<Array<BookedDatesDTOFromClient>>>
    = signal(State.Builder<Array<BookedDatesDTOFromClient>>().forInit());

  // A computed signal to expose the current value of checkAvailability$
  checkAvailabilitySig = computed(() => this.checkAvailability$());

  // A writable signal to store the state of retrieving booked listings
  private getBookedListing$: WritableSignal<State<Array<BookedListing>>>
    = signal(State.Builder<Array<BookedListing>>().forInit());

  // A computed signal to expose the current value of getBookedListing$
  getBookedListingSig = computed(() => this.getBookedListing$());

  // A writable signal to store the state of the cancel booking process
  private cancel$: WritableSignal<State<string>>
    = signal(State.Builder<string>().forInit());

  // A computed signal to expose the current value of cancel$
  cancelSig = computed(() => this.cancel$());

  // A writable signal to store the state of retrieving booked listings for the landlord
  private getBookedListingForLandlord$: WritableSignal<State<Array<BookedListing>>>
    = signal(State.Builder<Array<BookedListing>>().forInit());

  // A computed signal to expose the current value of getBookedListingForLandlord$
  getBookedListingForLandlordSig = computed(() => this.getBookedListingForLandlord$());

  // Method to create a new booking
  create(newBooking: CreateBooking) {
    this.http.post<boolean>(`${environment.API_URL}/booking/create`, newBooking)
      .subscribe({
        // On success, update the createBooking$ signal with a successful state
        next: created => this.createBooking$.set(State.Builder<boolean>().forSuccess(created)),
        // On error, update the createBooking$ signal with an error state
        error: err => this.createBooking$.set(State.Builder<boolean>().forError(err)),
      });
  }

  // Method to check availability of booking dates for a specific listing
  checkAvailability(publicId: string): void {
    // Create HttpParams with the listing public ID
    const params = new HttpParams().set("listingPublicId", publicId);

    this.http.get<Array<BookedDatesDTOFromServer>>(`${environment.API_URL}/booking/check-availability`, {params})
      .pipe(
        // Map the response to convert the dates using dayjs
        map(this.mapDateToDayJS())
      ).subscribe({
      // On success, update the checkAvailability$ signal with the booked dates
      next: bookedDates =>
        this.checkAvailability$.set(State.Builder<Array<BookedDatesDTOFromClient>>().forSuccess(bookedDates)),
      // On error, update the checkAvailability$ signal with an error state
      error: err => this.checkAvailability$.set(State.Builder<Array<BookedDatesDTOFromClient>>().forError(err))
    })
  }

  // Method to map booked dates from server format to client format using dayjs
  private mapDateToDayJS = () => {
    return (bookedDates: Array<BookedDatesDTOFromServer>): Array<BookedDatesDTOFromClient> => {
      // Convert each date using dayjs
      return bookedDates.map(reservedDate => this.convertDateToDayJS(reservedDate))
    }
  }

  // Method to convert server DTO to client DTO with dayjs date objects
  private convertDateToDayJS<T extends BookedDatesDTOFromServer>(dto: T): BookedDatesDTOFromClient {
    return {
      ...dto, // Spread the original DTO properties
      startDate: dayjs(dto.startDate), // Convert start date to dayjs
      endDate: dayjs(dto.endDate),  // Convert end date to dayjs
    };
  }

  // Method to reset the create booking signal to its initial state
  resetCreateBooking() {
    this.createBooking$.set(State.Builder<boolean>().forInit());
  }

  // Method to retrieve booked listings for the current user

  getBookedListing(): void {
    this.http.get<Array<BookedListing>>(`${environment.API_URL}/booking/get-booked-listing`)
      .subscribe({
        // On success, update the getBookedListing$ signal with the booked listings
        next: bookedListings =>
          this.getBookedListing$.set(State.Builder<Array<BookedListing>>().forSuccess(bookedListings)),
        // On error, update the getBookedListing$ signal with an error state
        error: err => this.getBookedListing$.set(State.Builder<Array<BookedListing>>().forError(err)),
      });
  }

  // Method to cancel a booking by sending a DELETE request to the server
  cancel(bookingPublicId: string, listingPublicId: string, byLandlord: boolean): void {
    // Create HttpParams with the necessary parameters
    const params = new HttpParams()
      .set("bookingPublicId", bookingPublicId)
      .set("listingPublicId", listingPublicId)
      .set("byLandlord", byLandlord);
    this.http.delete<string>(`${environment.API_URL}/booking/cancel`, {params})
      .subscribe({
        // On success, update the cancel$ signal with the canceled booking's ID
        next: canceledPublicId => this.cancel$.set(State.Builder<string>().forSuccess(canceledPublicId)),
        // On error, update the cancel$ signal with an error state
        error: err => this.cancel$.set(State.Builder<string>().forError(err)),
      });
  }

  // Method to reset the cancel signal to its initial state
  resetCancel(): void {
    this.cancel$.set(State.Builder<string>().forInit());
  }

  // Method to retrieve booked listings for the landlord
  getBookedListingForLandlord(): void {
    this.http.get<Array<BookedListing>>(`${environment.API_URL}/booking/get-booked-listing-for-landlord`)
      .subscribe({
        // On success, update the getBookedListingForLandlord$ signal with the booked listings
        next: bookedListings =>
          this.getBookedListingForLandlord$.set(State.Builder<Array<BookedListing>>().forSuccess(bookedListings)),
        // On error, update the getBookedListingForLandlord$ signal with an error state
        error: err => this.getBookedListingForLandlord$.set(State.Builder<Array<BookedListing>>().forError(err)),
      });
  }

}
