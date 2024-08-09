import {Component, inject, OnInit} from '@angular/core';
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {CategoryService} from "./category.service";
import {Category, CategoryName} from "./category.model";
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {filter, map} from "rxjs";

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    FontAwesomeModule
  ],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent implements OnInit {
  categoryService: CategoryService = inject(CategoryService);

  categories: Category[] | undefined;

  currentActivateCategory = this.categoryService.getCategoryByDefault()

  isHome = false;
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
    this.listenRouter(); // Deactivate the current category initially
    this.currentActivateCategory.activated = false; // Deactivate the current category initially
    this.fetchCategories(); // Fetch the categories from the service
  }

  private fetchCategories(): void {
    this.categories = this.categoryService.getCategories();
  }

  // Private method to listen to router events and query parameters
  private listenRouter() {
    // Listening to router events, filtering for NavigationEnd events
    this.router.events.pipe(
      filter((evt): evt is NavigationEnd => evt instanceof NavigationEnd)
    )
      .subscribe({ // Subscribe to the filtered NavigationEnd events
        // Check if the current URL is the home page ("/")
        next: (evt: NavigationEnd) => {
          // If the URL is home and has no query parameters
          this.isHome = evt.url.split("?")[0] === "/";
          if (this.isHome && evt.url.indexOf("?") === -1) {
            // Get the category with the technical name "ALL" and change to this category
            const categoryByTechnicalName = this.categoryService.getCategoryByTechnicalName("ALL");
            this.categoryService.changeCategory(categoryByTechnicalName!);
          }
        },
      });

    // Listening to query parameter changes in the activated route
    this.activatedRoute.queryParams
      .pipe(
        map(params => params["category"]) // Extracting the "category" query parameter
      )
      .subscribe({
        next: (categoryName: CategoryName) => {
          const category = this.categoryService.getCategoryByTechnicalName(categoryName);
          if (category) {
            this.activateCategory(category); // Activate the category if found
            this.categoryService.changeCategory(category); // Change the category in the service
          }
        }
      })
  }

  private activateCategory(category: Category) {
    this.currentActivateCategory.activated = false;
    this.currentActivateCategory = category;
    this.currentActivateCategory.activated = true;
  }

  onChangeCategory(category: Category) { // Method called when a category is selected by the user
    this.activateCategory(category); // Activate the selected category
    this.router.navigate([], { // Navigate to the current route with the new category as a query parameter
      queryParams: {"category": category.technicalName},
      relativeTo: this.activatedRoute // Keep the navigation relative to the current activated route
    })
  }
}
