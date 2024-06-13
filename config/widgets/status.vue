<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  request: Function,
  apiUrl: String,
  data: Object
})

const request = props.request

const count = ref({
  "day_send_count": 0,
  "day_fnc_count": 0,
  "day_recv_count": 0,
  "month_send_count": [],
  "month_fnc_count": [],
  "month_recv_count": []
})

request.post(`${props.apiUrl}/system/GetKarinStatusCount`)
  .then((response) => {
    if (response.data.status === 'success') {
      count.value = response.data.data
    } else {
      count.value = {
        "day_send_count": 0,
        "day_fnc_count": 0,
        "day_recv_count": 0,
        "month_send_count": [],
        "month_fnc_count": [],
        "month_recv_count": []
      }
    }
  })
  .catch((error) => {
    count.value = {
      "day_send_count": 0,
      "day_fnc_count": 0,
      "day_recv_count": 0,
      "month_send_count": [],
      "month_fnc_count": [],
      "month_recv_count": []
    }
  })

const chartOptions = computed(() => {
  return {
    chart: {
      type: 'bar',
      height: 480,
      fontFamily: `inherit`,
      foreColor: '#a1aab2',
      stacked: true
    },
    colors: ['#eef2f6', '#1e88e5', '#5e35b1'],
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0
          }
        }
      }
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%'
      }
    },
    xaxis: {
      type: 'category',
      categories: count.value.month_send_count.slice(0, 7).reverse().map(item => item.date)
    },
    legend: {
      show: true,
      fontFamily: `'Roboto', sans-serif`,
      position: 'bottom',
      offsetX: 20,
      labels: {
        useSeriesColors: false
      },
      markers: {
        width: 16,
        height: 16,
        radius: 5
      },
      itemMargin: {
        horizontal: 15,
        vertical: 8
      }
    },
    fill: {
      type: 'solid'
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      show: true
    },
    tooltip: {
      theme: 'dark'
    }
  };
});

const lineChart = computed(() => {
  return [
    {
      name: '发送消息',
      data: count.value.month_send_count.slice(0, 7).reverse().map(item => item.value)
    },
    {
      name: '收到消息',
      data: count.value.month_recv_count.slice(0, 7).reverse().map(item => item.value)
    },
    {
      name: '插件触发',
      data: count.value.month_fnc_count.slice(0, 7).reverse().map(item => item.value)
    }
  ]

});
</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="9">
            <span class="text-subtitle-2 text-disabled font-weight-bold">只显示最近7天</span>
            <h3 class="text-h3 mt-1">消息统计</h3>
          </v-col>
        </v-row>
        <div class="mt-4">
          <apexchart type="bar" height="480" :options="chartOptions" :series="lineChart"> </apexchart>
        </div>
      </v-card-text>
    </v-card>
  </v-card>
</template>
