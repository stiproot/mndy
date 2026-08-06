import { IUnit } from "@/types/i-unit";
import { toLocale } from "@/services/timestamp.service";

export const buildCard = (node: IUnit) => {

  if (node.assigned_to_avatar_url === "") node.assigned_to_avatar_url = "/default-avatar.png";
  if (node.assigned_to === "") node.assigned_to = "Not assigned";

  const completeFrac = node.perc_complete / 100;
  const description = node.description ? `${node.description?.substring(0, 200)}...` : null;
  const acceptanceCriteria = node.ac ? `${node.ac?.substring(0, 200)}...` : null;
  let heading = `${node.id} | ${node.type}`;
  if (node.utc_target_timestamp && node.utc_target_timestamp !== "") heading += ` | due: ${toLocale(node.utc_target_timestamp)}`;

  let cardHtml = `
    <div class="q-card q-card--bordered q-card--flat no-shadow" style="cursor:pointer">
      <div class="q-card__section q-card__section--vert">

        <div class="text-overline text-orange-9"><span data-type="link">${heading}</span></div>

        <div class="q-item q-item-type row no-wrap" role="listitem">
          <div class="q-item__section column q-item__section--side justify-center q-item__section--avatar">
            <div class="q-avatar">
              <div class="q-avatar__content row flex-center overflow-hidden">
                <img src="${node.assigned_to_avatar_url}">
              </div>
            </div>
          </div>
          <div class="q-item__section column q-item__section--main justify-center">
            <div class="q-item__label">${node.title}</div>
            <div class="q-item__label q-item__label--caption text-caption">${node.assigned_to}</div>
          </div>
        </div>
        `;

  if (description) cardHtml += `
        <div class="text-caption text-grey">${description}</div>
        `;

  if (acceptanceCriteria) cardHtml += `
        <div v-if="false" class="text-caption text-grey">${acceptanceCriteria}</div>
        `;

  cardHtml += `
      </div>

      <hr class="q-separator q-separator--horizontal" aria-orientation="horizontal">

      <div class="q-card__actions justify-start q-card__actions--horiz row">

        <div class="q-item q-item-type row no-wrap" role="listitem">
          <div class="q-item__section column q-item__section--side justify-center q-item__section--avatar">
          <i class="q-icon text-primary notranslate material-icons" aria-hidden="true" role="presentation">percent</i>
          </div>
          <div class="q-item__section column q-item__section--main justify-center">
            <div class="q-item__label">${node.perc_complete}</div>
            <div class="q-item__label q-item__label--caption text-caption">Complete.</div>
          </div>
        </div>

        <div class="q-item q-item-type row no-wrap" role="listitem">
          <div class="q-item__section column q-item__section--side justify-center q-item__section--avatar"><i
              class="q-icon text-red notranslate material-icons" aria-hidden="true" role="presentation">timer</i></div>
          <div class="q-item__section column q-item__section--main justify-center">
            <div class="q-item__label">${node.completed_work}</div>
            <div class="q-item__label q-item__label--caption text-caption">Hours spent.</div>
          </div>

        </div>
      </div>

      <div class="row no-wrap">
        <div class="q-linear-progress" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="${completeFrac}"
          style="--q-linear-progress-speed: 2100ms;">
          <div class="q-linear-progress__track absolute-full q-linear-progress__track--with-transition q-linear-progress__track--light"
            style="transform: scale3d(1, 1, 1);"></div>
          <div class="q-linear-progress__model absolute-full q-linear-progress__model--with-transition q-linear-progress__model--determinate"
            style="transform: scale3d(${completeFrac}, 1, 1);"></div>
        </div>
      </div>

    </div>
    `;

  return cardHtml;
}