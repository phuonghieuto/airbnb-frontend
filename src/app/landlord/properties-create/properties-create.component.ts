import {Component, effect, inject, OnDestroy} from '@angular/core';
import {DynamicDialogRef} from "primeng/dynamicdialog";
import {LandlordListingService} from "../landlord-listing.service";
import {ToastService} from "../../layout/toast.service";
import {AuthService} from "../../core/auth/auth.service";
import {Router} from "@angular/router";
import {Step} from "./step.model";
import {CreatedListing, Description, NewListing, NewListingInfo} from "../model/listing.model";
import {NewListingPicture} from "../model/picture.model";
import {State} from "../../core/model/state.model";
import {CategoryName} from "../../layout/navbar/category/category.model";
import {CategoryStepComponent} from "./step/category-step/category-step.component";
import {LocationStepComponent} from "./step/location-step/location-step.component";
import {InfoStepComponent} from "./step/info-step/info-step.component";
import {PictureStepComponent} from "./step/picture-step/picture-step.component";
import {DescriptionStepComponent} from "./step/description-step/description-step.component";
import {PriceStepComponent} from "./step/price-step/price-step.component";
import {PriceVO} from "../model/listing-vo.model";
import {FooterStepComponent} from "../../shared/footer-step/footer-step.component";

// Component decorator defines metadata for the component
@Component({
  selector: 'app-properties-create',
  standalone: true,
  imports: [
    CategoryStepComponent,
    FooterStepComponent,
    LocationStepComponent,
    InfoStepComponent,
    PictureStepComponent,
    DescriptionStepComponent,
    PriceStepComponent
  ],
  templateUrl: './properties-create.component.html',
  styleUrl: './properties-create.component.scss'
})
export class PropertiesCreateComponent implements OnDestroy {

  // Constants for step IDs
  CATEGORY = "category";
  LOCATION = "location";
  INFO = "info";
  PHOTOS = "photos";
  DESCRIPTION = "description";
  PRICE = "price";

  // Dependency injection for required services
  dialogDynamicRef = inject(DynamicDialogRef);
  listingService = inject(LandlordListingService);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  router = inject(Router);

  // Array of steps for the listing creation process
  steps: Step[] = [
    {
      id: this.CATEGORY,
      idNext: this.LOCATION,
      idPrevious: null,
      isValid: false
    },
    {
      id: this.LOCATION,
      idNext: this.INFO,
      idPrevious: this.CATEGORY,
      isValid: false
    },
    {
      id: this.INFO,
      idNext: this.PHOTOS,
      idPrevious: this.LOCATION,
      isValid: false
    },
    {
      id: this.PHOTOS,
      idNext: this.DESCRIPTION,
      idPrevious: this.INFO,
      isValid: false
    },
    {
      id: this.DESCRIPTION,
      idNext: this.PRICE,
      idPrevious: this.PHOTOS,
      isValid: false
    },
    {
      id: this.PRICE,
      idNext: null,
      idPrevious: this.DESCRIPTION,
      isValid: false
    }
  ];

  // Current step in the creation process
  currentStep = this.steps[0];

  // Initial data structure for the new listing
  newListing: NewListing = {
    category: "ALL",
    infos: {
      guests: {value: 0},
      bedrooms: {value: 0},
      beds: {value: 0},
      baths: {value: 0}
    },
    location: "",
    pictures: new Array<NewListingPicture>(),
    description: {
      title: {value: ""},
      description: {value: ""}
    },
    price: {value: 0}
  };

  // Flag to indicate if the listing creation is in progress
  loadingCreation = false;

  // Constructor sets up listeners for user fetching and listing creation
  constructor() {
    this.listenFetchUser();
    this.listenListingCreation();
  }

  // Method to initiate the creation of a new listing
  createListing(): void {
    this.loadingCreation = true;
    this.listingService.create(this.newListing);
  }

  // Cleanup method to reset the listing creation state
  ngOnDestroy(): void {
    this.listingService.resetListingCreation();
  }

  // Effect to listen for user fetching and handle navigation on success
  listenFetchUser() {
    effect(() => {
      if (this.authService.fetchUser().status === "OK"
        && this.listingService.createSig().status === "OK") {
        this.router.navigate(["landlord", "properties"]);
      }
    });
  }

  // Effect to listen for listing creation and handle success or error
  listenListingCreation() {
    effect(() => {
      let createdListingState = this.listingService.createSig();
      if (createdListingState.status === "OK") {
        this.onCreateOk(createdListingState);
      } else if (createdListingState.status === "ERROR") {
        this.onCreateError();
      }
    });
  }

  // Method to handle successful listing creation
  onCreateOk(createdListingState: State<CreatedListing>) {
    this.loadingCreation = false;
    this.toastService.send({
      severity: "success", summary: "Success", detail: "Listing created successfully.",
    });
    this.dialogDynamicRef.close(createdListingState.value?.publicId);
    this.authService.renewAccessToken();
  }

  // Method to handle errors during listing creation
  private onCreateError() {
    this.loadingCreation = false;
    this.toastService.send({
      severity: "error", summary: "Error", detail: "Couldn't create your listing, please try again.",
    });
  }

  // Method to move to the next step in the creation process
  nextStep(): void {
    if (this.currentStep.idNext !== null) {
      this.currentStep = this.steps.filter((step: Step) => step.id === this.currentStep.idNext)[0];
    }
  }

  // Method to move to the previous step in the creation process
  previousStep(): void {
    if (this.currentStep.idPrevious !== null) {
      this.currentStep = this.steps.filter((step: Step) => step.id === this.currentStep.idPrevious)[0];
    }
  }

  // Method to check if all steps in the creation process are valid
  isAllStepsValid(): boolean {
    return this.steps.filter(step => step.isValid).length === this.steps.length;
  }

  // Method to handle changes to the category step
  onCategoryChange(newCategory: CategoryName): void {
    this.newListing.category = newCategory;
  }

  // Method to handle changes to the validity of the current step
  onValidityChange(validity: boolean) {
    this.currentStep.isValid = validity;
  }

  // Method to handle changes to the location step
  onLocationChange(newLocation: string) {
    this.newListing.location = newLocation;
  }

  // Method to handle changes to the info step
  onInfoChange(newInfo: NewListingInfo) {
    this.newListing.infos = newInfo;
  }

  // Method to handle changes to the pictures step
  onPictureChange(newPictures: NewListingPicture[]) {
    this.newListing.pictures = newPictures;
  }

  // Method to handle changes to the description step
  onDescriptionChange(newDescription: Description) {
    this.newListing.description = newDescription;
  }

  // Method to handle changes to the price step
  onPriceChange(newPrice: PriceVO) {
    this.newListing.price = newPrice;
  }
}
