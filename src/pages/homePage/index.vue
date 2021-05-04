<template>
  <view class="homePage">
    <text>{{ msg }}</text>
    <button @tap="redirectTo('/pages/testPage/index')">测试页</button>
    <button @tap="redirectTo('/pages/stuMainPage/index')">学生主页</button>
    <button @tap="redirectTo('/pages/uploadPage/index')">进入教室「学生」</button>
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
    function redirectTo(path) {
      //销毁所有页面并进入
      Taro.reLaunch({
        url: path,
      });
    }
    return {
      msg,
      redirectTo
    };
    
  },
  
};
</script>
