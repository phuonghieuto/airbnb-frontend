import {Component, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {TenantListingService} from "../tenant/tenant-listing.service";
import {ToastService} from "../layout/toast.service";
import {CategoryService} from "../layout/navbar/category/category.service";
import {ActivatedRoute, Router} from "@angular/router";
import {CardListing} from "../landlord/model/listing.model";
import {Pagination} from "../core/model/request.model";
import {filter, Subscription} from "rxjs";
import {Category} from "../layout/navbar/category/category.model";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {CardListingComponent} from "../shared/card-listing/card-listing.component";
// import {Search} from "../tenant/search/search.model";
import dayjs from "dayjs";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FaIconComponent,
    CardListingComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {

  tenantListingService = inject(TenantListingService);
  toastService = inject(ToastService);
  categoryService = inject(CategoryService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  listings: Array<CardListing> | undefined; // Stores the listings to be displayed

  pageRequest: Pagination = {size: 20, page: 0, sort: []}; // Default pagination settings

  loading = false;

  categoryServiceSubscription: Subscription | undefined; // Subscription to category change events
  searchIsLoading = false; // Flag to indicate if a search is in progress
  emptySearch = false; // Flag to indicate if search results are empty
  private searchSubscription: Subscription | undefined; // Subscription to search events

  constructor() {
    this.listenToGetAllCategory();
    this.listenToSearch();
  }

  ngOnDestroy(): void {
    this.tenantListingService.resetGetAllCategory(); // Reset the category listing state on component destruction

    if (this.categoryServiceSubscription) {
      this.categoryServiceSubscription.unsubscribe();
    }

    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    // this.startNewSearch(); // Initiate a search when the component is initialized
    this.listenToChangeCategory(); // Listen for changes in the selected category
  }

  private listenToChangeCategory() {
    this.categoryServiceSubscription = this.categoryService.changeCategoryObs.subscribe({
      next: (category: Category) => {
        this.loading = true;
        if (!this.searchIsLoading) { // Only fetch listings if no search is currently in progress
          this.tenantListingService.getAllByCategory(this.pageRequest, category.technicalName);
        }
      }
    })
  }

  private listenToGetAllCategory() {
    effect(() => {
      const categoryListingsState = this.tenantListingService.getAllByCategorySig(); // Get the current state of category listings
      if (categoryListingsState.status === "OK") {
        this.listings = categoryListingsState.value?.content;
        this.loading = false;
        this.emptySearch = false;
      } else if (categoryListingsState.status === "ERROR") {
        this.toastService.send({
          severity: "error", detail: "Error when fetching the listing", summary: "Error",
        });
        this.loading = false;
        this.emptySearch = false;
      }
    });
  }

  private listenToSearch() {
    this.searchSubscription = this.tenantListingService.search.subscribe({
      next: searchState => {
        if (searchState.status === "OK") {
          this.loading = false;
          this.searchIsLoading = false;
          this.listings = searchState.value?.content;
          this.emptySearch = this.listings?.length === 0;
        } else if (searchState.status === "ERROR") {
          this.loading = false;
          this.searchIsLoading = false;
          this.toastService.send({
            severity: "error", summary: "Error when search listing",
          })
        }
      }
    })
  }

  // private startNewSearch(): void {
  //   this.activatedRoute.queryParams.pipe(
  //     filter(params => params['location']),
  //   ).subscribe({
  //     next: params => {
  //       this.searchIsLoading = true;
  //       this.loading = true;
  //       const newSearch: Search = {
  //         dates: {
  //           startDate: dayjs(params["startDate"]).toDate(),
  //           endDate: dayjs(params["endDate"]).toDate(),
  //         },
  //         infos: {
  //           guests: {value: params['guests']},
  //           bedrooms: {value: params['bedrooms']},
  //           beds: {value: params['beds']},
  //           baths: {value: params['baths']},
  //         },
  //         location: params['location'],
  //       };
  //
  //       this.tenantListingService.searchListing(newSearch, this.pageRequest);
  //     }
  //   })
  // }

  // onResetSearchFilter() {
  //   this.router.navigate(["/"], {
  //     queryParams: {"category": this.categoryService.getCategoryByDefault().technicalName}
  //   });
  //   this.loading = true;
  //   this.emptySearch = false;
  // }
}
