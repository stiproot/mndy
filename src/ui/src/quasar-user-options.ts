import './styles/quasar.sass';
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/material-symbols-rounded/material-symbols-rounded.css';
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css';
import { Notify } from 'quasar';

// To be used on app.use(Quasar, { ... })
export default {
  config: {
  },
  plugins: {
    Notify
  },
  extras: [
    'material-symbols-rounded',
    'fontawesome-v6'
  ],
  framework: {
    iconSet: 'fontawesome-v6'
  },
  animations: 'all'
};
