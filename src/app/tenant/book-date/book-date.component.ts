import {Component, effect, inject, input, OnDestroy, OnInit} from '@angular/core';
import {Listing} from "../../landlord/model/listing.model";
import {BookingService} from "../service/booking.service";
import {ToastService} from "../../layout/toast.service";
import {AuthService} from "../../core/auth/auth.service";
import {Router} from "@angular/router";
import dayjs from "dayjs";
import {BookedDatesDTOFromClient, CreateBooking} from "../model/booking.model";
import {CurrencyPipe} from "@angular/common";
import {CalendarModule} from "primeng/calendar";
import {FormsModule} from "@angular/forms";
import {MessageModule} from "primeng/message";

@Component({
  selector: 'app-book-date',
  standalone: true,
  imports: [
    CurrencyPipe,
    CalendarModule,
    FormsModule,
    MessageModule
  ],
  templateUrl: './book-date.component.html',
  styleUrl: './book-date.component.scss'
})
export class BookDateComponent implements OnInit, OnDestroy {

  listing = input.required<Listing>();
  listingPublicId = input.required<string>();

  bookingService = inject(BookingService);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  router = inject(Router);

  bookingDates = new Array<Date>();
  totalPrice = 0;

  minDate = new Date();
  bookedDates = new Array<Date>();

  constructor() {
    this.listenToCheckAvailableDate();
    this.listenToCreateBooking()
  }


  ngOnDestroy(): void {
    this.bookingService.resetCreateBooking();
  }

  ngOnInit(): void {
    this.bookingService.checkAvailability(this.listingPublicId());
  }

  // Handler for when the user selects new booking dates
  onDateChange(newBookingDates: Array<Date>) {
    this.bookingDates = newBookingDates; // Update the selected booking dates
    if (this.validateMakeBooking()) { // If the dates are valid and the user is authenticated
      const startBookingDateDayJS = dayjs(newBookingDates[0]);
      const endBookingDateDayJS = dayjs(newBookingDates[1]);
      // Calculate the total price based on the number of days and listing price
      this.totalPrice = endBookingDateDayJS.diff(startBookingDateDayJS, "days") * this.listing().price.value;
    } else {
      this.totalPrice = 0; // Reset total price if dates are invalid
    }
  }

  // Validation function to check if booking dates are valid
  validateMakeBooking() {
    return this.bookingDates.length === 2
      && this.bookingDates[0] !== null
      && this.bookingDates[1] !== null
      && this.bookingDates[0].getDate() !== this.bookingDates[1].getDate()
      && this.authService.isAuthenticated();
  }

  // Handler for creating a new booking
  onNewBooking() {
    const newBooking: CreateBooking = { // Create a new booking object
      listingPublicId: this.listingPublicId(),
      startDate: this.bookingDates[0],
      endDate: this.bookingDates[1],
    }
    // Call the booking service to create a new booking
    this.bookingService.create(newBooking);
  }

  // Listen for changes in the availability state
  private listenToCheckAvailableDate() { // Get the current availability state
    effect(() => {
      const checkAvailabilityState = this.bookingService.checkAvailabilitySig();

      // Map the booked dates to an array of Date objects
      if (checkAvailabilityState.status === "OK") {
        this.bookedDates = this.mapBookedDatesToDate(checkAvailabilityState.value!);
      } else if (checkAvailabilityState.status === "ERROR") {
        this.toastService.send({
          severity: "error", detail: "Error when fetching the not available dates", summary: "Error",
        });
      }
    });
  }

  // Map booked dates from DTOs to Date objects
  private mapBookedDatesToDate(bookedDatesDTOFromClients: Array<BookedDatesDTOFromClient>): Array<Date> {
    const bookedDates = new Array<Date>();
    for (let bookedDate of bookedDatesDTOFromClients) {
      bookedDates.push(...this.getDatesInRange(bookedDate));
    }
    return bookedDates;
  }

  // Get all dates in a range from startDate to endDate
  private getDatesInRange(bookedDate: BookedDatesDTOFromClient) {
    const dates = new Array<Date>();

    let currentDate = bookedDate.startDate;
    while (currentDate <= bookedDate.endDate) {
      dates.push(currentDate.toDate());
      currentDate = currentDate.add(1, "day");
    }

    return dates;
  }

  // Listen for changes in the booking creation state
  private listenToCreateBooking() {
    effect(() => {
      const createBookingState = this.bookingService.createBookingSig();
      if (createBookingState.status === "OK") {
        this.toastService.send({
          severity: "success", detail: "Booking created successfully",
        });
        this.router.navigate(['/booking']);
      } else if (createBookingState.status === "ERROR") {
        this.toastService.send({
          severity: "error", detail: "Booking created failed",
        });
      }
    });
  }
}
