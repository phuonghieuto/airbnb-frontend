import {Component, effect, ElementRef, EventEmitter, inject, input, OnInit, Output} from '@angular/core';
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {FormsModule} from "@angular/forms";
import {AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent} from "primeng/autocomplete";
import {CountryService} from "../country.service";
import {ToastService} from "../../../../../layout/toast.service";
import {OpenStreetMapProvider} from "leaflet-geosearch";
import {Country} from "../country.model";
import L, {circle, latLng, polygon, tileLayer} from "leaflet";
import {filter, map} from "rxjs";

@Component({
  selector: 'app-location-map',  // HTML tag for the component
  standalone: true,  // Indicates the component can be used independently
  imports: [
    LeafletModule,  // Module for map functionality
    FormsModule,  // Module for form controls
    AutoCompleteModule  // Module for autocomplete functionality
  ],
  templateUrl: './location-map.component.html',  // Path to the component's HTML template
  styleUrl: './location-map.component.scss'  // Path to the component's CSS styles
})
export class LocationMapComponent implements OnInit {

  // Inject the CountryService to fetch country data
  countryService = inject(CountryService);
  // Inject the ToastService to display toast messages
  toastService = inject(ToastService);

  // Define private properties for the map and search provider
  private map: L.Map | undefined;  // Holds the Leaflet map instance
  private provider: OpenStreetMapProvider | undefined;  // Holds the OpenStreetMapProvider instance for geocoding

  // Define input properties
  location = input.required<string>();
  placeholder = input<string>("Select your home country");  // Input with a default value for placeholder

  // Define a property to hold the current selected location
  currentLocation: Country | undefined;

  // Define an output event emitter to emit location changes
  @Output()
  locationChange = new EventEmitter<string>();  // Emits the new location code when it changes

  // Define a method to format the label for autocomplete options
  formatLabel = (country: Country) => country.flag + "   " + country.name.common;  // Formats the country label for display

  // Define options for the Leaflet map
  options = {
    layers: [
      tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 18, attribution: "..."}),  // Base map layer
    ],
    zoom: 5,  // Initial zoom level
    center: latLng(46.87996, -121.726909)  // Initial map center coordinates
  }

  // Define layers control for the map
  layersControl = {
    baseLayers: {
      "Open Street Map": tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,  // Maximum zoom level
        attribution: "..."  // Map attribution text
      }),
    },
    overlays: {
      "Big Circle": circle([46.95, -122], {radius: 5000}),  // Example overlay: big circle
      "Big square": polygon([[46.8, -121.55], [46.8, -121.55], [46.8, -121.55], [46.8, -121.55]])  // Example overlay: big square
    }
  }

  // Define properties to hold country data and filtered countries for autocomplete
  countries: Array<Country> = [];  // Holds the list of all countries
  filteredCountries: Array<Country> = [];  // Holds the list of filtered countries for autocomplete

  // Constructor initializes listening to location changes
  constructor(private elementRef: ElementRef) {
    this.listenToLocation();  // Start listening to location changes when the component is created
  }

  // Lifecycle hook called when the map is ready
  onMapReady(map: L.Map) {
    this.map = map;  // Assign the map instance to the component property for future use
    this.configSearchControl();  // Configure the search control for geocoding
  }

  // Method to configure the search control
  private configSearchControl() {
    this.provider = new OpenStreetMapProvider();  // Initialize the OpenStreetMap provider for geocoding searches
  }

  // Event handler for location change in the autocomplete
  onLocationChange(newEvent: AutoCompleteSelectEvent) {
    const newCountry = newEvent.value as Country;  // Get the selected country from the event
    this.locationChange.emit(newCountry.cca3);  // Emit the new country code through the output event emitter
  }

  // Private method to listen to location changes and handle fetching countries
  private listenToLocation() {
    effect(() => {
      const countriesState = this.countryService.countries();  // Get the current state of countries from the service
      if (countriesState.status === "OK" && countriesState.value) {  // Check if the countries state is successful
        this.countries = countriesState.value;  // Assign the fetched countries to the component property
        this.filteredCountries = countriesState.value;  // Initialize the filtered countries with all countries
        this.changeMapLocation(this.location());  // Update the map location based on the current location
      } else if (countriesState.status === "ERROR") {  // Handle error state
        this.toastService.send({
          severity: "error", summary: "Error",
          detail: "Something went wrong when loading countries on change location"  // Show an error toast message
        });
      }
    });
  }


  // Private method to change the map location based on a country code
  private changeMapLocation(term: string) {
    this.currentLocation = this.countries.find(country => country.cca3 === term);  // Find the country by its code
    if (this.currentLocation) {
      this.provider!.search({query: this.currentLocation.name.common})  // Search for the country location using its common name
        .then((results) => {
          if (results && results.length > 0) {  // Check if search results are available
            const firstResult = results[0];  // Get the first search result
            this.map!.setView(new L.LatLng(firstResult.y, firstResult.x), 13);  // Update the map view to the new location
            L.marker([firstResult.y, firstResult.x])  // Add a marker to the map at the new location
              .addTo(this.map!)
              .bindPopup(firstResult.label)  // Bind a popup with the location label
              .openPopup();  // Open the popup
          }
        });
    }
  }

  // Method to handle search in the autocomplete
  search(newCompleteEvent: AutoCompleteCompleteEvent): void {
    this.filteredCountries = this.countries.filter(country =>
      country.name.common.toLowerCase().startsWith(newCompleteEvent.query.toLowerCase()));  // Filter countries based on the search query
  }

  // Import the filter function from rxjs
  protected readonly filter = filter;

  ngOnInit(): void {
    // Extending L.Icon.Default to set custom icons
    L.Icon.Default.prototype.options.iconRetinaUrl = 'marker-icon-2x.png';
    L.Icon.Default.prototype.options.iconUrl = 'marker-icon.png';
    L.Icon.Default.prototype.options.shadowUrl = '/marker-shadow.png';
  }
}
