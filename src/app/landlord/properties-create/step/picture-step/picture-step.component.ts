import {Component, EventEmitter, input, Output} from '@angular/core';
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {InputTextModule} from "primeng/inputtext";
import {ButtonModule} from "primeng/button";
import {NewListingPicture} from "../../../model/picture.model";

@Component({
  selector: 'app-picture-step',
  standalone: true,
  imports: [FontAwesomeModule, InputTextModule, ButtonModule],
  templateUrl: './picture-step.component.html',
  styleUrl: './picture-step.component.scss'
})
export class PictureStepComponent {

  // Define input property 'pictures' to hold an array of NewListingPicture
  pictures = input.required<Array<NewListingPicture>>();

  // Define an output event emitter for when the pictures array changes
  @Output()
  picturesChange = new EventEmitter<Array<NewListingPicture>>();

  // Define an output event emitter for when the step validity changes
  @Output()
  stepValidityChange = new EventEmitter<boolean>();

  // Extract files from the event target (input element)
  extractFileFromTarget(target: EventTarget | null) {
    const htmlInputTarget = target as HTMLInputElement;  // Cast the target to HTMLInputElement
    if (target === null || htmlInputTarget.files === null) {  // Check if target or files are null
      return null;  // Return null if no files are present
    }
    return htmlInputTarget.files;  // Return the files from the input element
  }

  // Handle the event when new pictures are uploaded
  onUploadNewPicture(target: EventTarget | null) {
    const picturesFileList = this.extractFileFromTarget(target);  // Extract files from the event target
    if (picturesFileList !== null) {  // Check if files are present
      for (let i = 0; i < picturesFileList.length; i++) {  // Iterate through the file list
        const picture = picturesFileList.item(i);  // Get each file
        if (picture !== null) {  // Check if the file is not null
          const displayPicture: NewListingPicture = {
            file: picture,  // Set the file
            urlDisplay: URL.createObjectURL(picture)  // Create a URL for displaying the picture
          }
          this.pictures().push(displayPicture);  // Add the new picture to the pictures array
        }
      }
      this.picturesChange.emit(this.pictures());  // Emit the updated pictures array
      this.validatePictures();  // Validate the pictures array to check step validity
    }
  }

  // Validate the pictures array to ensure it meets the requirements
  private validatePictures() {
    if (this.pictures().length >= 5) {  // Check if the pictures array has 5 or more items
      this.stepValidityChange.emit(true);  // Emit true if valid
    } else {
      this.stepValidityChange.emit(false);  // Emit false if not valid
    }
  }

  // Handle the event to delete a picture
  onTrashPicture(pictureToDelete: NewListingPicture) {
    const indexToDelete = this.pictures().findIndex(picture => picture.file.name === pictureToDelete.file.name);  // Find the index of the picture to delete
    this.pictures().splice(indexToDelete, 1);  // Remove the picture from the array
    this.validatePictures();  // Validate the pictures array to update step validity
  }
}
