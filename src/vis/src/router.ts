import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import ChartGalleryView from './views/ChartGalleryView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: ChartGalleryView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes,
});

export default router;
