import { createRouter, createWebHistory, RouteLocationNormalized, NavigationGuardNext, RouteRecordRaw } from "vue-router";
import { AuthService } from "@/services/auth.service";

// Import views
import LandingView from "../views/LandingView.vue";
import SettingsView from "../views/SettingsView.vue";
import LoginView from "../views/LoginView.vue";
import AuthCallbackView from "../views/AuthCallbackView.vue";
import ChatView from "../views/ChatView.vue";

// Module Federation remote imports for AzDO views (kept for backwards compatibility)
const CloneAzdoWiView = () => import('mndyAzdo/CloneAzdoWiView');
const CreateAzdoDashboardView = () => import('mndyAzdo/CreateAzdoDashboardView');
const BulkCreateAzdoWisView = () => import('mndyAzdo/BulkCreateAzdoWisView');
const UpdateAzdoWiView = () => import('mndyAzdo/UpdateAzdoWiView');

const authService = new AuthService();

const routes = [
  {
    path: "/",
    redirect: { name: "chat" },
  },
  {
    path: "/",
    name: "landing",
    component: LandingView,
    meta: { requiresAuth: true, title: "mndy", description: "Welcome to mndy, your AI-powered assistant." },
    children: [
      {
        path: "/chat",
        name: "chat",
        component: ChatView,
        meta: { requiresAuth: true, title: "Chat | mndy", description: "Chat with the AI assistant." },
      },
      {
        path: "/chat/:conversationId",
        name: "chat.conversation",
        component: ChatView,
        meta: { requiresAuth: true, title: "Chat | mndy", description: "Continue a conversation." },
      },
      // Module Federation routes for AzDO work items (backwards compatibility)
      {
        path: "/workitems",
        name: "workitems",
        meta: { requiresAuth: true, title: "Work Items | mndy", description: "Manage work items." },
        children: [
          {
            path: "clone",
            name: "azdo.clone",
            component: CloneAzdoWiView,
            meta: { title: "Clone Work Item Tree | mndy", description: "Clone a work item tree." },
          },
          {
            path: "bulkcreate",
            name: "azdo.bulk",
            component: BulkCreateAzdoWisView,
            meta: { title: "Bulk Create Work Items | mndy", description: "Bulk create work items based off a SDLC template." },
          },
          {
            path: "update",
            name: "azdo.update",
            component: UpdateAzdoWiView,
            meta: { title: "Update Work Item Tree | mndy", description: "Define a new tag and apply it to a work item tree." },
          },
        ],
      },
      {
        path: "/dashboard",
        name: "dashboard",
        meta: { requiresAuth: true, title: "Dashboard | mndy", description: "Manage dashboards." },
        children: [
          {
            path: "create",
            name: "azdo.dashboards",
            component: CreateAzdoDashboardView,
            meta: { title: "Create Dashboard | mndy", description: "Create a new dashboard." },
          },
        ],
      },
      {
        path: "/settings",
        name: "settings",
        component: SettingsView,
        meta: { requiresAuth: true, title: "Settings | mndy", description: "Manage application settings." },
      },
    ]
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { requiresAuth: false, title: "Login | mndy", description: "Login to your account." },
  },
  {
    path: "/authorization-code/callback",
    name: "callback",
    component: AuthCallbackView,
    meta: { requiresAuth: false, title: "mndy", description: "Authorization callback." },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  if (to.matched.some((record: RouteRecordRaw) => record.meta?.requiresAuth)) {
    if (authService.isAuthenticated()) {
      const accessToken = authService.getAccessToken();
      if (!accessToken) {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        });
      }

      const expiry = accessToken?.obj.expiresAt * 1000;

      if (Date.now() > expiry) {
        console.info('router -> refreshing.');
        await authService.refreshTokens();
      }

      next();
    } else {
      console.info('router -> [NOT] authenticated.');
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    }
  }
  else {
    console.info('router -> [NO] auth required. from: ', from, ', to: ', to, ' , next: ', next);
    next();
  }
});

router.afterEach((to: RouteLocationNormalized) => {
  // Use the title from the meta field if it exists
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
});

export default router;
