import {Component, input} from '@angular/core';
import {NgClass} from "@angular/common";
import {FaIconComponent, FontAwesomeModule} from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    FontAwesomeModule
  ],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  imageUrl = input<string>();
  avatarSize = input<"avatar-sm" | "avatar-xl">();
}
