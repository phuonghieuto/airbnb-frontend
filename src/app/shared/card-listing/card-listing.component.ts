import {Component, effect, EventEmitter, inject, input, Output} from '@angular/core';
import {CardListing} from "../../landlord/model/listing.model";
import {BookedListing} from "../../tenant/model/booking.model";
import {Router} from "@angular/router";
import {CategoryService} from "../../layout/navbar/category/category.service";
import {CountryService} from "../../landlord/properties-create/step/location-step/country.service";
import {CurrencyPipe, DatePipe} from "@angular/common";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'app-card-listing',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FaIconComponent
  ],
  templateUrl: './card-listing.component.html',
  styleUrl: './card-listing.component.scss'
})
export class CardListingComponent {

  listing = input.required<CardListing | BookedListing>();
  cardMode = input<"landlord" | "booking">();

  @Output()
  deleteListing = new EventEmitter<CardListing>();
  @Output()
  cancelBooking = new EventEmitter<BookedListing>();

  bookingListing: BookedListing | undefined;
  cardListing: CardListing | undefined;

  router = inject(Router);
  categoryService = inject(CategoryService);
  countryService = inject(CountryService);


  constructor() {
    this.listenToListing();
    this.listenToCardMode();
  }

  // Method to listen to changes in the listing input.
  private listenToListing() {
    effect(() => {
      const listing = this.listing(); // Get the current listing value.
      this.countryService.getCountryByCode(listing.location) // Get the country details based on the listing's location code.
        .subscribe({
          next: country => { // Get the country details based on the listing's location code.
            if (listing) {
              this.listing().location = country.region + ", " + country.name.common
            }
          }
        })
    });
  }

  // Method to listen to changes in the card mode input.
  private listenToCardMode() {
    effect(() => {
      const cardMode = this.cardMode(); // Get the current card mode.
      if (cardMode && cardMode === "booking") {
        this.bookingListing = this.listing() as BookedListing // Cast the listing to a BookedListing and store it.
      } else {
        this.cardListing = this.listing() as CardListing; // Cast the listing to a CardListing and store it.
      }
    });
  }

  onDeleteListing(displayCardListingDTO: CardListing) {
    this.deleteListing.emit(displayCardListingDTO);
  }

  onCancelBooking(bookedListing: BookedListing) {
    this.cancelBooking.emit(bookedListing);
  }

  onClickCard(publicId: string) {
    this.router.navigate(['listing'], // Navigate to the listing page.
      {queryParams: {id: publicId}}); // Pass the public ID of the listing as a query parameter.
  }

}
