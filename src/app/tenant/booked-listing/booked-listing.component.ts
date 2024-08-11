import {Component, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {BookingService} from "../service/booking.service";
import {ToastService} from "../../layout/toast.service";
import {BookedListing} from "../model/booking.model";
import {CardListingComponent} from "../../shared/card-listing/card-listing.component";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'app-booked-listing',
  standalone: true,
  imports: [
    CardListingComponent,
    FaIconComponent
  ],
  templateUrl: './booked-listing.component.html',
  styleUrl: './booked-listing.component.scss'
})
export class BookedListingComponent implements OnInit, OnDestroy {

  bookingService = inject(BookingService);
  toastService = inject(ToastService);
  bookedListings = new Array<BookedListing>();

  loading = false;

  constructor() {
    this.listenFetchBooking();
    this.listenCancelBooking()
  }

  ngOnDestroy(): void {
    this.bookingService.resetCancel();
  }

  ngOnInit(): void {
    this.fetchBooking();
  }

  // Method to fetch the list of booked listings
  private fetchBooking() {
    this.loading = true;
    this.bookingService.getBookedListing();
  }

  // Method to handle the cancellation of a booking
  onCancelBooking(bookedListing: BookedListing) {
    bookedListing.loading = true; // Sets the loading state for the specific listing being canceled

    // Calls the booking service to cancel the booking, passing the necessary IDs and indicating that the cancellation is not by the landlord
    this.bookingService.cancel(bookedListing.bookingPublicId, bookedListing.listingPublicId, false);
  }

  // Method to listen for changes in the fetch booking state
  private listenFetchBooking() {
    effect(() => {
      const bookedListingsState = this.bookingService.getBookedListingSig(); // Gets the current state of fetched bookings
      if (bookedListingsState.status === "OK") {
        this.loading = false;
        this.bookedListings = bookedListingsState.value!;
      } else if(bookedListingsState.status === "ERROR") {
        this.loading = false;
        this.toastService.send({
          severity: "error", summary: "Error when fetching the listing",
        });
      }
    });
  }

  // Method to listen for changes in the cancel booking state
  private listenCancelBooking() {
    effect(() => {
      const cancelState = this.bookingService.cancelSig();
      if (cancelState.status === "OK") {
        const listingToDeleteIndex = this.bookedListings.findIndex(
          listing => listing.bookingPublicId === cancelState.value
        );
        this.bookedListings.splice(listingToDeleteIndex, 1);
        this.toastService.send({
          severity: "success", summary: "Successfully cancelled booking",
        });
      } else if (cancelState.status === "ERROR") {
        const listingToDeleteIndex = this.bookedListings.findIndex(
          listing => listing.bookingPublicId === cancelState.value
        );
        this.bookedListings[listingToDeleteIndex].loading = false;
        this.toastService.send({
          severity: "error", summary: "Error when cancel your booking",
        })
      }
    });
  }
}
