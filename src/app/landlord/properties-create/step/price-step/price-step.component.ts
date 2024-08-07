import {Component, EventEmitter, input, Output, ViewChild} from '@angular/core';
import {FormsModule, NgForm} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {PriceVO} from "../../../model/listing-vo.model";

@Component({
  selector: 'app-price-step',
  standalone: true,
  imports: [FormsModule, InputTextModule, FontAwesomeModule],
  templateUrl: './price-step.component.html',
  styleUrl: './price-step.component.scss'
})
export class PriceStepComponent {

  // Define input property 'price' to hold a PriceVO object
  price = input.required<PriceVO>();

  // Define an output event emitter for when the price object changes
  @Output()
  priceChange = new EventEmitter<PriceVO>();

  // Define an output event emitter for when the step validity changes
  @Output()
  stepValidityChange = new EventEmitter<boolean>();

  // ViewChild to reference the form in the template
  @ViewChild("formPrice")
  formPrice: NgForm | undefined;

  // Handle the event when the price is changed
  onPriceChange(newPrice: number) {
    // Emit the updated price object with the new price value
    this.priceChange.emit({value: newPrice});
    // Validate the form and emit the validity status
    this.stepValidityChange.emit(this.validateForm());
  }

  // Validate the form to check if it is valid
  private validateForm() {
    // Check if the form is defined
    if (this.formPrice) {
      // Return the form's validity status
      return this.formPrice?.valid!;
    } else {
      // Return false if the form is not defined
      return false;
    }
  }
}

