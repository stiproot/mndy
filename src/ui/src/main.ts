import { createApp, provide } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import { Quasar } from "quasar";
import quasarUserOptions from "./quasar-user-options";
import './styles/global.scss';
import router from "./router";
import VueCodemirror from 'vue-codemirror';


createApp(App)
  .use(router)
  .use(Quasar, quasarUserOptions)
  .use(createPinia())
  .use(VueCodemirror)
  .mount("#app");
