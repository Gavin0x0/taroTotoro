<template>
  <view class="homePage">
    <text>{{ msg }}</text>
    <button @tap="redirectTo('/pages/testPage/index')">测试页</button>
    <button @tap="redirectTo('/pages/teaMainPage/index')">「教师」</button>
    <button @tap="redirectTo('/pages/uploadPage/index')">「学生」</button>
  </view>
</template>

<script>
import { ref } from "vue";
import Taro from "@tarojs/taro"
import "./index.scss";
export default {
  name: "home",
  setup(props) {
    const msg = ref("欢迎进入，请选择你的角色");
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
