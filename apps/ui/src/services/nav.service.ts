import { Router } from "vue-router";

export class NavService {

  private _router: Router;

  constructor(router: Router) {
    this._router = router;
    this.goToProject = this.goToProject.bind(this);
  }

  isNewProject = (): boolean =>
    this._router.currentRoute.value.path.includes("projects/new");

  projectDimension() {
    const last = this._router.currentRoute.value.path.split("/").pop();
    return last;
  }

  azdoDims() {
    const last = this._router.currentRoute.value.path.split("/").pop();
    return last;
  }

  goToProjects() {
    this._router.push({ name: "projects" });
  }

  goToProject(id: string) {
    this._router.push({
      name: "project",
      params: { projectId: id },
      query: { tab: "queries" },
    });
  }

  goToEditProject(id: string) {
    this._router.push({
      name: "project.edit",
      params: { projectId: id },
    });
  }

  goToSettings() {
    this._router.push({
      name: "settings",
    });
  }

  newProject() {
    this._router.push({
      name: "definition",
      params: { projectId: "new" },
      query: { tab: "info" },
    });
  }

  goToCreateProjectFromTemplate() {
    this._router.push({
      name: "project.createfromtemplate",
    });
  }

  goToProjDefinition(id: string) {
    this._router.push({
      name: "project.definition",
      params: { projectId: id },
      query: { tab: "actions" },
    });
  }

  goToProjHome(id: string) {
    this._router.push({
      name: "project.home",
      params: { projectId: id },
    });
  }

  goToVis(projId: string) {
    this._router.push({
      name: "project.vis",
      params: { projectId: projId },
      query: { tab: "charts" },
    });
  }

  goToActions(projId: string) {
    this._router.push({
      name: "project.definition",
      params: { projectId: projId },
      query: { tab: "actions" },
    });
  }

  goToWis() {
    this._router.push({
      name: "azdo.wis",
      query: { tab: "clone" },
    });
  }

  goToDashboards() {
    this._router.push({
      name: "azdo.dashboards",
    });
  }

  goToChart(projId: string, chartId: string) {
    this._router.push({
      name: "vis.chart",
      params: { projectId: projId, chartId: chartId },
    });
  }

  goToGrid(projId: string, gridId: string) {
    this._router.push({
      name: "vis.grid",
      params: { projectId: projId, gridId: gridId },
    });
  }

  goToTree(projId: string, treeId: string) {
    this._router.push({
      name: "vis.tree",
      params: { projectId: projId, treeId: treeId },
    });
  }

  getRouteParam(param: string) {
    return this._router.currentRoute.value.params[param];
  }

  replace(query: any) {
    this._router.replace(query);
  }

  get projId() {
    return this.getRouteParam("projectId");
  }

  get chartId() {
    return this.getRouteParam("chartId");
  }

  get treeId() {
    return this.getRouteParam("treeId");
  }

  get gridId() {
    return this.getRouteParam("gridId");
  }

  get isNew(): boolean {
    return this._router.currentRoute.value.path.includes("new");
  }
}
