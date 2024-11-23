import { createApp } from "vue";
import { createPinia } from "pinia";

import "./assets/global.css";
import naive from "naive-ui";

import App from "./App.vue";

const pinia = createPinia();
createApp(App).use(naive).use(pinia).mount("#app");
