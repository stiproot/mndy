import { createApp } from 'vue';
import { Quasar } from 'quasar';
import App from './App.vue';
import router from './router';

// Import Quasar css
import 'quasar/dist/quasar.css';

const app = createApp(App);

app.use(Quasar, {
  config: {},
});

app.use(router);

app.mount('#app');
