<template>
  <div class="q-pa-md">
    <div class="q-pa-md">
      <range-filter-component
        :minVal="0"
        :stepVal="5"
        :maxVal="50"
        :disabled="defaulted"
        @adjusted="handleRiskImpactAdjusted"
      />
    </div>
    <div class="q-gutter-y-md column">
      <tag-filter-component
        :options="tagOptions"
        @selected="handleTagsSelected"
      />
    </div>

    <div class="q-gutter-y-md column">
      <div class="q-pa-md">
        <table>
          <tr>
            <td>
              <select-filter-component
                label="RAG"
                :options="ragOptions"
                @selected="handleRagSelected"
              />
            </td>
            <td>
              <select-filter-component
                label="Severity"
                :options="severityOptions"
                @selected="handleSeveritySelected"
              />
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="q-gutter-y-md">
      <div class="q-pa-md">
        <q-toggle v-model="defaulted" color="red" label="Unweighted" />
      </div>
    </div>
  </div>
</template>
<script>
import { toRefs, reactive, ref, onMounted, watch } from "vue";
import RangeFilterComponent from "./RangeFilterComponent.vue";
import SelectFilterComponent from "./SelectFilterComponent.vue";
import TagFilterComponent from "./TagFilterComponent.vue";
export default {
  name: "FilterControlsComponent",
  components: {
    RangeFilterComponent,
    SelectFilterComponent,
    TagFilterComponent,
  },
  setup(props, { emit }) {
    const emitEvent = (data) => {
      emit("filter", data);
    };

    const tags = [
      "Artifacts",
      "Behaviours",
      "Development",
      "Environments",
      "Project",
      "Personnel",
      "Testing",
      "Developer",
      "SDET",
      "Project Manager",
      "SEM",
      "Business Analyst",
    ];
    const tagOptions = ref(tags);

    const rags = ["Red", "Amber", "Green"];
    const ragOptions = ref(rags);
    const severities = [
      { label: "(1) Negligible", value: 1 },
      { label: "(2) Minor", value: 2 },
      { label: "(3) Moderate", value: 3 },
      { label: "(4) Major", value: 4 },
      { label: "(5) Catastrophic", value: 5 },
    ];
    const severityOptions = ref(severities);
    const defaulted = ref(false);

    const data = reactive({
      tagOptions,
      severityOptions,
      ragOptions,
      defaulted,
    });

    const filter = {
      severities: severities,
      tagFilter: { or: true, tags: tags },
      rags: rags,
      risk_impact_range: { min: 0, max: 50 },
      defaulted: false,
    };

    watch(
      () => defaulted.value,
      (val) => {
        filter.defaulted = val;
        triggerFilter();
      }
    );

    let setTimeoutId = 0;
    const triggerFilter = () => {
      if (setTimeoutId) {
        clearTimeout(setTimeoutId);
      }

      setTimeoutId = setTimeout(() => {
        emitEvent(filter);
        clearTimeout(setTimeoutId);
      }, 1000);
    };

    const handleRiskImpactAdjusted = (e) => {
      filter.risk_impact_range = e;
      triggerFilter();
    };

    const handleTagsSelected = (e) => {
      filter.tagFilter = e;
      triggerFilter();
    };

    const handleRagSelected = (e) => {
      filter.rags = e;
      triggerFilter();
    };

    const handleSeveritySelected = (e) => {
      filter.severities = e;
      triggerFilter();
    };

    onMounted(() => {
      triggerFilter();
    });

    return {
      ...toRefs(data),
      handleTagsSelected,
      handleRiskImpactAdjusted,
      handleRagSelected,
      handleSeveritySelected,
    };
  },
};
</script>
<style></style>
