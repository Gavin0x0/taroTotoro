<template>
  <view class="homePage">
    <at-flex
      class="homepage"
      direction="column"
      align="center"
      justify="center"
      alignContent="center"
    >
      <at-flex-item
        size="3"
        class="welcome-container"
        @tap="redirectTo('/pages/testPage/index')"
      >
        <text class="welcome-text">欢迎进入Totoro在线教室</text>
        <text class="welcome-text">请选择你的身份</text>
      </at-flex-item>
      <at-flex-item class="entry-container">
        <view
          class="icon-container"
          @tap="redirectTo('/pages/teaMainPage/index')"
        >
          <image
            mode="scaleToFill"
            :src="require('../../assets/tea.svg')"
            style="width: 16vh; height: 16vh"
          ></image>
          <text class="entry-text">教师入口</text>
        </view>
      </at-flex-item>
      <at-flex-item class="entry-container">
        <view
          class="icon-container"
          @tap="redirectTo('/pages/uploadPage/index')"
        >
          <image
            mode="scaleToFill"
            :src="require('../../assets/stu.svg')"
            style="width: 16vh; height: 16vh"
          ></image>
          <text class="entry-text">学生入口</text>
        </view>
      </at-flex-item>
    </at-flex>
  </view>
</template>

<script>
import { ref } from "vue";
import Taro from "@tarojs/taro";
import { AtFlex, AtButton, AtFlexItem } from "taro-ui-vue3";
import "./index.scss";
export default {
  name: "home",
  components: {
    AtFlexItem,
    AtFlex,
  },
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
      redirectTo,
    };
  },
};
</script>
<style>
.homepage {
  width: 100%;
  height: 80vh;
}
.icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 25vh;
  height: 25vh;
  border-radius: 50%;
  border: 10px solid #6190e8;
}
.welcome-text {
  font-size: 1.5rem;
  margin-top: 0.75rem;
}
.welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.entry-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.entry-text {
  color: #6190e8;
  font-size: 1.2rem;
}
</style>