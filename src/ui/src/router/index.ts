import { createRouter, createWebHistory } from "vue-router";
import { AuthService } from "@/services/auth.service";

// Import views and components
import ProjRootView from "../views/ProjRootView.vue";
import LandingView from "../views/LandingView.vue";
import ProjManagerView from "../views/ProjManagerView.vue";
import ProjHomeView from "../views/ProjHomeView.vue";
import ProjDefinitionView from "../views/ProjDefinitionView.vue";
import ProjEditInfoView from "../views/ProjEditInfoView.vue";
import ProjCreateFromTemplateView from "../views/ProjCreateFromTemplateView.vue";
import VisManagerView from "../views/VisManagerView.vue";
import ChartComponent from "../components/ChartComponent.vue";
import ExpandableTreeComponent from "../components/ExpandableTreeComponent.vue";
import NestedTreeMapComponent from "../components/charts/NestedTreeMapComponent.vue";
import AzdoManagerView from "../views/AzdoManagerView.vue";
import AzdoWiManagerView from "../views/AzdoWiManagerView.vue";
import CreateAzdoDashboardView from "../views/azdo/CreateAzdoDashboardView.vue";
import CloneAzdoWiView from "../views/azdo/CloneAzdoWiView.vue";
import BulkCreateAzdoWisView from "../views/azdo/BulkCreateAzdoWisView.vue";
import UpdateAzdoWiView from "../views/azdo/UpdateAzdoWiView.vue";
import SettingsView from "../views/SettingsView.vue";
import ProcManagerComponent from "../components/ProcManagerComponent.vue";
import LoginView from "../views/LoginView.vue";
import AuthCallbackView from "../views/AuthCallbackView.vue";

const authService = new AuthService();

const routes = [
  {
    path: "/",
    redirect: { name: "projects" },
  },
  {
    path: "/",
    name: "landing",
    component: LandingView,
    meta: { requiresAuth: true, title: "mndy", description: "Welcome to mndy, your project management tool." },
    children: [
      {
        path: "/projects",
        name: "projects",
        component: ProjManagerView,
        meta: { requiresAuth: true, title: "Projects | mndy", description: "Manage your projects here." },
      },
      {
        path: "/projects/:projectId",
        name: "project",
        component: ProjRootView,
        props: (route: any) => ({ tabId: route.query["tab"] }),
        meta: { requiresAuth: true, title: "Project Details | mndy", description: "View and manage project details." },
        children: [
          {
            path: "vis",
            name: "project.vis",
            component: VisManagerView,
            props: (route: any) => ({ tabId: route.query["tab"] }),
            meta: { title: "Visualizations | mndy", description: "View project visualizations." },
            children: [
              {
                path: "chart/:chartId",
                name: "vis.chart",
                component: ChartComponent,
                meta: { title: "Chart | mndy", description: "View chart details." },
              },
              {
                path: "tree/:treeId",
                name: "vis.tree",
                component: ExpandableTreeComponent,
                meta: { title: "Tree | mndy", description: "View tree structure." },
              },
              {
                path: "grid/:gridId",
                name: "vis.grid",
                component: NestedTreeMapComponent,
                meta: { title: "Grid | mndy", description: "View grid details." },
              },
            ],
          },
          {
            path: "definition",
            name: "project.definition",
            component: ProjDefinitionView,
            props: (route: any) => ({ tabId: route.query["tab"] }),
            meta: { title: "Project Definition | mndy", description: "Define project details." },
          }
        ],
      },
      {
        path: "/projects/:projectId/home",
        name: "project.home",
        component: ProjHomeView,
        meta: { title: "Project Home | mndy", description: "Project home dashboard." },
      },
      {
        path: "/projects/:projectId/edit",
        name: "project.edit",
        component: ProjEditInfoView,
        meta: { title: "Edit Project | mndy", description: "Edit project details." },
      },
      {
        path: "/projects/new",
        name: "definition",
        component: ProjDefinitionView,
        props: (route: any) => ({ tabId: route.query["tab"] }),
        meta: { requiresAuth: true, title: "New Project | mndy", description: "Create a new project." },
      },
      {
        path: "/projects/createfromtemplate",
        name: "project.createfromtemplate",
        component: ProjCreateFromTemplateView,
        meta: { requiresAuth: true, title: "Create New Project | mndy", description: "Create a new project from a template." },
      },
      {
        path: "/azdo",
        name: "azdo",
        component: AzdoManagerView,
        meta: { requiresAuth: true, title: "Azure DevOps Manager | mndy", description: "Manage Azure DevOps integrations." },
        children: [
          {
            path: "wis",
            name: "azdo.wis",
            component: AzdoWiManagerView,
            props: (route: any) => ({ tabId: route.query["tab"] }),
            meta: { title: "Work Items | mndy", description: "Manage work items." },
          },
          {
            path: "dashboards",
            name: "azdo.dashboards",
            component: CreateAzdoDashboardView,
            meta: { title: "Dashboards | mndy", description: "Create and manage dashboards." },
          },
        ],
      },
      {
        path: "/workitems",
        name: "workitems",
        meta: { requiresAuth: true, title: "Azure DevOps Manager | mndy", description: "Manage work items." },
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
        meta: { requiresAuth: true, title: "Azure DevOps Manager | mndy", description: "Manage dashboards." },
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
      {
        path: "/processes",
        name: "processes",
        component: ProcManagerComponent,
        meta: { requiresAuth: true, title: "Processes | mndy", description: "Manage processes." },
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

router.beforeEach(async (to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
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

router.afterEach((to) => {
  // Use the title from the meta field if it exists
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
});

export default router;