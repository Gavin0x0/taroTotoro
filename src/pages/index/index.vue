<template>
  <view class="index">
    <text>{{ msg }}</text>
    <button @tap="redirectToHome">进入主页</button>
    <button @tap="redirectToTest">进入测试页</button>
    <button @tap="increment">增加 1</button>
    <view>当前todolist事项已有：{{ existCount }}条；</view>
    <view>当前操作已新增：{{ count }} ，共有{{ total }}条。</view>
  </view>
</template>

<script>
import { ref, computed, onMounted, toRefs, watch } from "vue";
import Taro from "@tarojs/taro"
import "./index.scss";

export default {
  name: "index",
  setup(props) {
    const msg = ref("Hello world - Index");
    // ref响应式变量
    const count = ref(0);
    const existCount = ref(4);
    // computed方法，在count的value发生改变时，会触发计算total
    const total = computed(() => count.value + existCount.value);
    function increment() {
      count.value++;
    }
    function redirectToHome() {
      //前进到页面「可返回」
      Taro.navigateTo({
        url: "/pages/homePage/index",
      });
    }
    function redirectToTest() {
      //前进到页面「可返回」
      Taro.navigateTo({
        url: "/pages/testPage/index",
      });
    }

    onMounted(() => console.log("component mounted!"));

    return {
      // 返回increment方法，existCount、count、total属性，供模板中调用
      redirectToHome,
      redirectToTest,
      increment,
      existCount,
      count,
      total,
      msg,
    };
  },
};
</script>
