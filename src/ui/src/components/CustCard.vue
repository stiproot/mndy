<template>
  <div style="height:700px; width:450px;">

    <br />
    <br />

    <div class="q-card q-card--bordered q-card--flat no-shadow" style="cursor:pointer">
      <div class="q-card__section q-card__section--vert">

        <div class="text-overline text-orange-9">1379103 | Large Project | 12/10/2025</div>

        <div data-v-51798198="" class="q-item q-item-type row no-wrap" role="listitem">
          <div data-v-51798198=""
            class="q-item__section column q-item__section--side justify-center q-item__section--avatar">
            <div data-v-51798198="" class="q-avatar">
              <div class="q-avatar__content row flex-center overflow-hidden">
                <img src="https://dev.azure.com/CompanyX/_apis/GraphProfile/MemberAvatars/aad.ZDIwNTdkNWUtZjgwZC03MTE2LWIzZTQtMDc2MzMwMzQzODll">
              </div>
            </div>
          </div>
          <div data-v-51798198="" class="q-item__section column q-item__section--main justify-center">
            <div data-v-51798198="" class="q-item__label">ISA - Promotions Manager 3.0 - Business Uplift</div>
            <div data-v-51798198="" class="q-item__label q-item__label--caption text-caption">Shantal Pillay</div>
          </div>
        </div>

        <div class="text-caption text-grey">

          <div>This project falls under the Promotions Manager 3.0 Program.</div>
          <div>The objective of the Promotions Manager 3.0 - Business Uplift is enhance player engagement by up to 30%.
          </div>

          <div>
            <br>
          </div>

          <hr class="q-separator q-separator--horizontal" aria-orientation="horizontal">

          <div class="q-card__actions justify-start q-card__actions--horiz row">

            <div class="q-item q-item-type row no-wrap" role="listitem">
              <div class="q-item__section column q-item__section--side justify-center q-item__section--avatar">
                <i class="q-icon text-primary notranslate material-icons" aria-hidden="true"
                  role="presentation">percent</i>
              </div>
              <div class="q-item__section column q-item__section--main justify-center">
                <div class="q-item__label">46.16</div>
                <div class="q-item__label q-item__label--caption text-caption">Complete.</div>
              </div>
            </div>

            <div class="q-item q-item-type row no-wrap" role="listitem">
              <div class="q-item__section column q-item__section--side justify-center q-item__section--avatar"><i
                  class="q-icon text-red notranslate material-icons" aria-hidden="true" role="presentation">timer</i>
              </div>
              <div class="q-item__section column q-item__section--main justify-center">
                <div class="q-item__label">584</div>
                <div class="q-item__label q-item__label--caption text-caption">Hours spent.</div>
              </div>

            </div>
          </div>

          <div class="row no-wrap">
            <div class="q-linear-progress" role="progressbar" aria-valuemin="0" aria-valuemax="1"
              aria-valuenow="0.46159999999999995" style="--q-linear-progress-speed: 2100ms;">
              <div
                class="q-linear-progress__track absolute-full q-linear-progress__track--with-transition q-linear-progress__track--light"
                style="transform: scale3d(1, 1, 1);"></div>
              <div
                class="q-linear-progress__model absolute-full q-linear-progress__model--with-transition q-linear-progress__model--determinate"
                style="transform: scale3d(0.46159999999999995, 1, 1);"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
<script>

export default {
  name: "CustCard",
  setup() {
    return {};
  },
};
</script>
<style scoped>
.q-card>div:not(.q--avoid-card-border) {
  border-left: 0;
  border-right: 0;
  box-shadow: none;
}

.q-card__section--vert {
  padding: 16px;
}

.q-card__section {
  position: relative;
}

.text-overline {
  font-size: .75rem;
  font-weight: 500;
  line-height: 2rem;
  letter-spacing: .16667em;
}

.text-orange-9 {
  color: #ef6c00 !important;
}

.text-h5 {
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 2rem;
  letter-spacing: normal;
}

.q-mt-sm {
  margin-top: 8px;
}

.q-mb-xs {
  margin-bottom: 4px;
}

.text-caption {
  font-size: .75rem;
  font-weight: 400;
  line-height: 1.25rem;
  letter-spacing: .03333em;
}

.text-grey {
  color: #9e9e9e !important;
}

.q-card {
  box-shadow: 0 1px 5px #0003, 0 2px 2px #00000024, 0 3px 1px -2px #0000001f;
  border-radius: 4px;
  vertical-align: top;
  background: #fff;
  position: relative;
}

.justify-center,
.flex-center {
  justify-content: center;
}

.column {
  flex-direction: column;
}

.q-item__section--avatar {
  color: inherit;
  min-width: 56px;
}

.q-item__section--side {
  color: #757575;
  align-items: flex-start;
  padding-right: 16px;
  width: auto;
  min-width: 0;
  max-width: 100%;
}

.q-separator--horizontal {
  display: block;
  height: 1px;
}

.q-separator {
  border: 0;
  background: #0000001f;
  margin: 0;
  transition: background .3s, opacity .3s;
  flex-shrink: 0;
}
</style>
