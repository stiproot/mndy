import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/clone',
  },
  {
    path: '/clone',
    name: 'clone',
    component: () => import('./views/CloneAzdoWiView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./views/CreateAzdoDashboardView.vue'),
  },
  {
    path: '/bulk',
    name: 'bulk',
    component: () => import('./views/BulkCreateAzdoWisView.vue'),
  },
  {
    path: '/update',
    name: 'update',
    component: () => import('./views/UpdateAzdoWiView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes,
});

export default router;
