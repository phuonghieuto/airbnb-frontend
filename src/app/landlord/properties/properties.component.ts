import {Component, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {LandlordListingService} from "../landlord-listing.service";
import {ToastService} from "../../layout/toast.service";
import {CardListing} from "../model/listing.model";
import {CardListingComponent} from "../../shared/card-listing/card-listing.component";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    CardListingComponent,
    FaIconComponent
  ],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss'
})
export class PropertiesComponent implements OnInit, OnDestroy {

  landlordListingService = inject(LandlordListingService);
  toastService = inject(ToastService);

  listings: Array<CardListing> | undefined = [];
  loadingDeletion = false;
  loadingFetchAll = false;


  constructor() {
    this.listenFetchAll();
    this.listenDeleteByPublicId();
  }

  // Subscribes to the signal from the landlordListingService to listen for fetching all listings.
  private listenFetchAll() {
    effect(() => {
      const allListingState = this.landlordListingService.getAllSig(); // Gets the current state of the fetch all operation.
      if (allListingState.status === "OK" && allListingState.value) { // If the fetch operation is successful:
        this.loadingFetchAll = false; // Stop showing the loading indicator
        this.listings = allListingState.value; // Update the listings array with the fetched data.
      } else if (allListingState.status === "ERROR") {
        this.toastService.send({
          severity: "error", summary: "Error", detail: "Error when fetching the listing",
        });
      }
    });
  }

  // Subscribes to the signal from the landlordListingService to listen for deletion of a listing by its public ID.
  private listenDeleteByPublicId() {
    effect(() => {
      const deleteState = this.landlordListingService.deleteSig(); // Gets the current state of the delete operation.
      if (deleteState.status === "OK" && deleteState.value) {
        // Find the index of the deleted listing.
        const listingToDeleteIndex = this.listings?.findIndex(listing => listing.publicId === deleteState.value);

        // Remove the deleted listing from the array.
        this.listings?.splice(listingToDeleteIndex!, 1);

        this.toastService.send({
          severity: "success", summary: "Deleted successfully", detail: "Listing deleted successfully.",
        });
      } else if (deleteState.status === "ERROR") {
        const listingToDeleteIndex = this.listings?.findIndex(listing => listing.publicId === deleteState.value);
        this.listings![listingToDeleteIndex!].loading = false;
        this.toastService.send({
          severity: "error", summary: "Error", detail: "Error when deleting the listing",
        });
      }
      this.loadingDeletion = false;
    });
  }


  ngOnDestroy(): void {
  }

  ngOnInit(): void {
    this.fetchListings()
  }

  onDeleteListing(listing: CardListing): void {
    listing.loading = true; // Show a loading indicator on the listing being deleted.
    this.landlordListingService.delete(listing.publicId);
  }

  private fetchListings() {
    this.loadingFetchAll = true; // Show a loading indicator while fetching.
    this.landlordListingService.getAll();
  }
}
