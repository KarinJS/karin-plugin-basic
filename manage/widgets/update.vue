<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps({
  request: Function,
  apiUrl: String,
  snackbar: Object,
  data: Object
})

const request = props.request

const updateList = ref([])

const checkUpdate = () => {
  request.get(`${props.apiUrl}/system/plugins/karin-plugin-basic/checkUpdate`)
  .then((response) => {
    if (response.data.status === 'success') {
      updateList.value = response.data.data
    } else {
      updateList.value = []
    }
  })
  .catch((error) => {
    updateList.value = []
  })
}

const pull = () => {
  request.post(`${props.apiUrl}/system/plugins/karin-plugin-basic/update`, { force: false })
  .then((response) => {
    if (response.data.status === 'success') {
      checkUpdate()
      props.snackbar.open('更新成功')
    } else {
      props.snackbar.open('更新失败', 'error')
    }
  })
  .catch((error) => {
    props.snackbar.open('接口错误', 'error')
  })
}

const pullForce = () => {
  request.post(`${props.apiUrl}/system/plugins/karin-plugin-basic/update`, { force: true })
  .then((response) => {
    if (response.data.status === 'success') {
      checkUpdate()
      props.snackbar.open('更新成功')
    } else {
      props.snackbar.open('更新失败', 'error')
    }
  })
  .catch((error) => {
    props.snackbar.open('接口错误', 'error')
  })
}

onMounted(() => {
  checkUpdate()
})

</script>

<template>
  <v-card elevation="0" class="overflow-hidden brown-lighten-shape brown-lighten-secondary-shape bg-brown-lighten">
    <v-card-text>
      <div class="d-flex align-start mb-6">
        <div class="ml-auto z-1">
          <v-menu :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-btn icon rounded="sm" color="#4E342E" variant="flat" size="small" v-bind="props">
                <v-icon icon="mdi-menu" stroke-width="1.5" size="20" />
              </v-btn>
            </template>
            <v-sheet rounded="md" width="200" class="elevation-10">
              <v-list density="compact">
                <v-list-item @click="pull">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-source-pull" stroke-width="1.5" size="20" />
                  </template>
                  <v-list-item-title class="ml-2">更新</v-list-item-title>
                </v-list-item>
                <v-list-item @click="pullForce">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-source-merge" stroke-width="1.5" size="20" />
                  </template>
                  <v-list-item-title class="ml-2">强制更新</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-menu>
        </div>
      </div>
      <h2 class="text-h1 font-weight-medium text-white">
        {{ updateList.length }}
      </h2>
      <span class="text-subtitle-1 text-medium-emphasis text-white">需要更新的插件数量</span>
    </v-card-text>
  </v-card>
</template>

<style>
.bg-brown-lighten {
  background: #8D6E63;
}

.brown-lighten-shape {
  position: relative;
}

.brown-lighten-shape:before {
  content: '';
  position: absolute;
  width: 210px;
  height: 210px;
  border-radius: 50%;
  top: -125px;
  right: -15px;
  opacity: 0.5;
}

.brown-lighten-shape:after {
  content: '';
  position: absolute;
  width: 210px;
  height: 210px;
  border-radius: 50%;
  top: -85px;
  right: -95px;
}

.brown-lighten-secondary-shape:before {
  background: #6D4C41;
}

.brown-lighten-secondary-shape:after {
  background: #6D4C41;
}
</style>
