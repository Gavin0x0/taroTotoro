<template>
  <view class="homePage">
    <text>{{ msg }}</text>
    <button @tap="redirectToIndex">Index</button>
    <button @tap="redirectToAdd">Add</button>
    <button @tap="redirectTo('/pages/testPage/index')">Test</button>
  </view>
</template>

<script>
import { ref } from "vue";
import Taro from "@tarojs/taro"

import "./index.scss";

export default {
  name: "home",
  setup(props) {
    const msg = ref("Hello world - Home Page");
    function redirectToIndex() {
      //销毁所有页面并进入
      Taro.reLaunch({
        url: '/pages/index/index',
      });
    }
    function redirectToAdd() {
      //销毁所有页面并进入
      Taro.reLaunch({
        url: '/pages/addPage/index',
      });
    }
    function redirectTo(path) {
      //销毁所有页面并进入
      Taro.reLaunch({
        url: path,
      });
    }
    return {
      msg,
      redirectToIndex,
      redirectToAdd,
      redirectTo
    };
    
  },
  
};
</script>
