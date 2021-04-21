<template>
  <view class="addPage">
    <text>{{ msg }}</text>
  </view>
</template>

<script>
import { ref } from 'vue'
import './index.scss'

export default {
  name: "add",
  setup () {
    const msg = ref('Add seat')
    return {
      msg
    }
  }
}
</script>
