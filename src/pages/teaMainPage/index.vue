<template>
  <view class="head-container">
    <at-avatar size="large" :openData="{ type: 'userAvatarUrl' }"></at-avatar>
    <text class="welcome-text">{{ "欢迎进入！" }}</text>
  </view>
  <view class="head-container">
    <text class="ws-text">{{ "服务器：" }}</text>
    <text class="ws-text" style="margin-right: 0.3em">{{
      stateList[wsState].text
    }}</text>
    <text :style="'color:' + stateList[wsState].color + ';font-size:10px'">{{
      "●"
    }}</text>
    <at-button
      v-if="wsState != 1"
      type="secondary"
      :loading="ifReConnect"
      circle
      size="small"
      @click="reConnect"
      >{{ ifReConnect ? "正在重连" : "重新连接" }}</at-button
    >
  </view>
</template>
<script>
import { ref } from "vue";
import "./index.scss";
import Taro from "@tarojs/taro";
import { AtAvatar, AtButton } from "taro-ui-vue3";
export default {
  components: {
    AtButton,
    AtAvatar,
  },
  mounted() {
    this.GetWebSocket();
  },
  setup() {
    //ws的四种状态对应样式
    const stateList = [
      { color: "#FFC82C", text: "未连接" },
      { color: "#13CE66", text: "已连接" },
      { color: "#FF4949", text: "连接失败" },
      { color: "#FF4949", text: "连接断开" },
    ];
    const wsState = ref(0); //ws状态
    const ifReConnect = ref(false); //是否正在重连
    const s_name = ref("教师"); //用户姓名
    const s_id = ref("null"); //用户ID
    //连接Websocket
    function GetWebSocket() {
      ifReConnect.value = true;
      Taro.connectSocket({
        url: "ws://123.207.136.134:9010/ajaxchattest",
        success: function () {
          console.log("connect success");
        },
        fail: function () {
          ifReConnect.value = false;
          console.log("connect fail");
        },
      }).then((task) => {
        task.onOpen(function () {
          console.log("onOpen");
          ifReConnect.value = false;
          wsState.value = 1;
          //task.send({ data: "xxx" });
        });
        task.onMessage(function (msg) {
          console.log("onMessage: ", msg);
          //task.close();
        });
        task.onError(function () {
          wsState.value = 2;
          ifReConnect.value = false;
          wx.showToast({
            title: "连接失败",
            icon: "error",
            duration: 1000,
          });
          console.log("onError");
        });
        task.onClose(function (e) {
          wsState.value = 3;
          console.log("onClose: ", e);
        });
      });
    }
    //断线重连
    function reConnect() {
      console.log("尝试重连");
      GetWebSocket();
    }
    return {
      GetWebSocket,
      stateList,
      reConnect,
      ifReConnect,
      wsState,
      s_name,
    };
  },
};
</script>
<style>
.head-container {
  margin: 5vw;
  display: flex;
  align-items: center;
}
.welcome-text {
  margin-left: 40px;
  font-size: 40px;
  font-weight: bold;
}
.ws-text {
  font-size: 30px;
  font-weight: normal;
}
</style>
