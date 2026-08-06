<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Visualization Gallery</div>
    <div class="text-body1 q-mb-lg">
      Platform-agnostic D3.js visualization components exposed via Module Federation.
    </div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Available Chart Types</div>
      </q-card-section>
      <q-card-section>
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label>Tidy Tree</q-item-label>
              <q-item-label caption>Hierarchical tree layout with zoom</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Packed Circle</q-item-label>
              <q-item-label caption>Circle packing visualization</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Sunburst / Zoomable Sunburst</q-item-label>
              <q-item-label caption>Radial partition layout</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Force Directed Tree</q-item-label>
              <q-item-label caption>Physics-based force simulation</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Nested Treemap</q-item-label>
              <q-item-label caption>Rectangular treemap with filtering</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Expandable Tree</q-item-label>
              <q-item-label caption>Interactive collapsible tree (Treeviz)</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Bubble Chart</q-item-label>
              <q-item-label caption>Bubble visualization with sizing</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Radial Cluster</q-item-label>
              <q-item-label caption>Radial dendrogram layout</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Usage</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body2 q-mb-sm">
          <strong>As Module Federation Remote:</strong>
        </div>
        <pre class="bg-grey-2 q-pa-sm" style="border-radius: 4px; overflow-x: auto;">
import { defineAsyncComponent } from 'vue';

const ChartComponent = defineAsyncComponent(
  () => import('mndyVis/ChartComponent')
);

// Use with platform adapter
import { AzDoAdapter } from 'mndyVis/Adapters';
const workItems = azDoUnits.map(u => AzDoAdapter.toWorkItem(u));
        </pre>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section>
        <div class="text-h6">Platform Adapters</div>
      </q-card-section>
      <q-card-section>
        <q-list>
          <q-item>
            <q-item-section avatar>
              <q-icon color="primary" name="check_circle" />
            </q-item-section>
            <q-item-section>
              <q-item-label>AzDoAdapter</q-item-label>
              <q-item-label caption>Transforms Azure DevOps work items to IWorkItem</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon color="grey" name="pending" />
            </q-item-section>
            <q-item-section>
              <q-item-label>GitHubAdapter</q-item-label>
              <q-item-label caption>Placeholder for GitHub Issues (coming soon)</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
// Chart gallery view - demonstrates available visualizations
</script>

<style scoped>
pre {
  font-size: 12px;
  line-height: 1.5;
}
</style>
