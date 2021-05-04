<template>
  <view class="head-container">
    <at-avatar size="large" :openData="{ type: 'userAvatarUrl' }"></at-avatar>
    <text class="welcome-text">{{ s_name + "，欢迎进入！" }}</text>
  </view>
  <view class="head-container">
    <text class="ws-text">{{ "连接状态：" }}</text>
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
  <at-flex>
    <at-flex-item :size="4"
      ><other-stu :s_data="stuList[0]"></other-stu
    ></at-flex-item>
    <at-flex-item :size="4"
      ><other-stu :s_data="stuList[1]"></other-stu
    ></at-flex-item>
    <at-flex-item :size="4"
      ><other-stu :s_data="stuList[2]"></other-stu
    ></at-flex-item>
  </at-flex>
  <at-flex>
    <at-flex-item :size="4"
      ><other-stu :s_data="stuList[3]"></other-stu
    ></at-flex-item>
    <at-flex-item :size="4">
      <image
        v-if="!ifShowCanvas"
        mode="scaleToFill"
        :src="QRpath"
        @tap="openQR"
        :class="ifOpenQR ? 'bigger' : 'nomal'"
        style="width: 33vw; height: 33vw"
      ></image>
      <canvas
        v-if="ifShowCanvas"
        canvas-id="myQrcode2"
        style="background: #fff; width: auto; height: 33vw"
      />
    </at-flex-item>
    <at-flex-item :size="4"
      ><other-stu :s_data="stuList[4]"></other-stu
    ></at-flex-item>
  </at-flex>
  <at-flex>
    <at-flex-item :size="4"
      ><other-stu :s_data="stuList[5]"></other-stu
    ></at-flex-item>
    <at-flex-item :size="4"
      ><other-stu :s_data="stuList[6]"></other-stu
    ></at-flex-item>
    <at-flex-item :size="4"
      ><other-stu :s_data="stuList[7]"></other-stu
    ></at-flex-item>
  </at-flex>
</template>
<script>
import { ref } from "vue";
import "./index.scss";
import Taro from "@tarojs/taro";
import { AtAvatar, AtFlex, AtFlexItem, AtButton } from "taro-ui-vue3";
import QRCode from "../../utils/weapp-qrcode.js";
import OtherStu from "./OtherStu";
export default {
  components: {
    AtFlexItem,
    AtButton,
    AtAvatar,
    AtFlex,
    OtherStu,
  },
  mounted() {
    this.geneQR("{id:123123}");
    this.GetWebSocket();
    let r = 1;
    wx.getSystemInfo({
      success: function (res) {
        //获取平台差异
        console.log("手机平台:" + res.platform);
        if(res.platform=='ios'){
          console.log("ios!!!")
          r = -1;
        }
      },
    });

    /** TODO: 当座位全部关联后关闭监听 
     * wx.stopDeviceMotionListening(Object object) 
     * wx.offDeviceMotionChange(function callback)
     */
    
    Taro.startDeviceMotionListening({
      interval: "ui",
      success: function () {
        console.log("方向监听开始");
      },
    });
    Taro.onDeviceMotionChange((res) => {
      console.log(res)
      // console.log(this.ifOpenQR)
      // console.log(this.ifAutoOpen)
      if (this.ifOpenQR == false) {
        if (r*res.beta > 20) {
          this.autoOpenQR(true);
          console.log("auto open");
        }
      } else {
        if (this.ifAutoOpen == true) {
          if (r*res.beta < 20) {
            this.autoOpenQR(false);
            console.log("auto close");
          }
        }
      }
    });
  },
  setup() {
    //ws的四种状态对应样式
    const stateList = [
      { color: "#FFC82C", text: "未连接" },
      { color: "#13CE66", text: "已连接" },
      { color: "#FF4949", text: "连接失败" },
      { color: "#FF4949", text: "连接断开" },
    ];
    const stuList = ref([
      { direction: "左前", s_name: "空" },
      { direction: "前面", s_name: "前" },
      { direction: "右前", s_name: "空" },
      { direction: "左边", s_name: "左" },
      { direction: "右边", s_name: "右" },
      { direction: "左后", s_name: "空" },
      { direction: "后面", s_name: "后" },
      { direction: "右后", s_name: "空" },
    ]);
    const wsState = ref(0); //ws状态
    const ifReConnect = ref(false); //是否正在重连
    const s_name = ref("同学"); //用户姓名
    const s_id = ref("null"); //用户ID
    const ifShowCanvas = ref(true); //是否绘制qrcode
    const ifOpenQR = ref(false); //是否放大QR
    const QRpath = ref(""); //二维码路径
    const ifAutoOpen = ref(false); //是否是自动放大的
    //生成二维码
    function geneQR(content) {
      ifShowCanvas.value = true;
      console.log("生成二维码：", content);
      let QR_size = wx.getSystemInfoSync().windowWidth / 3;
      new QRCode("myQrcode2", {
        text: content,
        width: QR_size,
        height: QR_size,
        padding: 12, // 生成二维码四周自动留边宽度，不传入默认为0
        correctLevel: QRCode.CorrectLevel.L, // 二维码可辨识度
        callback: (res) => {
          console.log(res.path);
          QRpath.value = res.path;
          ifShowCanvas.value = false;
          // 接下来就可以直接调用微信小程序的api保存到本地或者将这张二维码直接画在海报上面去
        },
      });
    }
    //放大二维码
    function openQR() {
      console.log("放大二维码");
      ifOpenQR.value = !ifOpenQR._rawValue;
    }
    //放大二维码
    function autoOpenQR(x) {
      console.log("放大二维码");
      ifOpenQR.value = x;
      ifAutoOpen.value = x;
    }
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
      stuList,
      reConnect,
      ifReConnect,
      ifShowCanvas,
      ifOpenQR,
      geneQR,
      autoOpenQR,
      ifAutoOpen,
      openQR,
      QRpath,
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
.bigger {
  transition: all 0.2s ease-in-out;
  transform: scaleX(3) scaleY(3);
}
.nomal {
  transition: all 0.1s ease-out;
  transform: scaleX(1) scaleY(1);
}
</style>
