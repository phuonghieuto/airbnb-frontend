import {Component, EventEmitter, input, Output, ViewChild} from '@angular/core';
import {InputTextModule} from "primeng/inputtext";
import {FormsModule, NgForm} from "@angular/forms";
import {Description} from "../../../model/listing.model";
import {InputTextareaModule} from "primeng/inputtextarea";

@Component({
  selector: 'app-description-step',
  standalone: true,
  imports: [InputTextModule, FormsModule, InputTextModule, InputTextareaModule],
  templateUrl: './description-step.component.html',
  styleUrl: './description-step.component.scss'
})
export class DescriptionStepComponent {

  // Define input property 'description' to hold a Description object
  description = input.required<Description>();

  // Define an output event emitter for when the description object changes
  @Output()
  descriptionChange = new EventEmitter<Description>();

  // Define an output event emitter for when the step validity changes
  @Output()
  stepValidityChange = new EventEmitter<boolean>();

  // ViewChild to reference the form in the template
  @ViewChild("formDescription")
  formDescription: NgForm | undefined;

  // Handle the event when the title is changed
  onTitleChange(newTitle: string) {
    this.description().title = {value: newTitle};  // Update the title in the description object
    this.descriptionChange.emit(this.description());  // Emit the updated description object
    this.stepValidityChange.emit(this.validateForm());  // Validate the form and emit the validity status
  }

  // Handle the event when the description text is changed
  onDescriptionChange(newDescription: string) {
    this.description().description = {value: newDescription};  // Update the description text in the description object
    this.descriptionChange.emit(this.description());  // Emit the updated description object
    this.stepValidityChange.emit(this.validateForm());  // Validate the form and emit the validity status
  }

  // Validate the form to check if it is valid
  private validateForm(): boolean {
    if (this.formDescription) { // Check if the form is defined
      return this.formDescription?.valid!; // Return the form's validity status
    } else {
      return false; // Return false if the form is not defined
    }
  }
}
