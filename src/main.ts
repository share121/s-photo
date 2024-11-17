import { createApp } from "vue";

import "./assets/global.css";
import naive from "naive-ui";

import App from "./App.vue";

createApp(App).use(naive).mount("#app");
