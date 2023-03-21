import Vue from "vue";
import Vuetify from "vuetify/lib/framework";
import VueApexCharts from "vue-apexcharts";
//import colors from "vuetify/lib/util/colors";

Vue.use(Vuetify);
Vue.use(VueApexCharts);

Vue.component("apexchart", VueApexCharts);

export default new Vuetify({
  theme: {
    dark: true,
  },
});
