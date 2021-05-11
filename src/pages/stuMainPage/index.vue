<template>
  <view class="head-container">
    <at-avatar size="large" :openData="{ type: 'userAvatarUrl' }"></at-avatar>
    <text class="welcome-text">{{ s_name + "，欢迎进入！" }}</text>
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
  <view class="head-container">
    <text class="ws-text">{{ "请先与周围八个方位建立关联" }}</text>
    <at-button type="secondary" circle size="small" @click="showHelp">{{
      "怎么做?"
    }}</at-button>
  </view>
  <at-flex>
    <at-flex-item :size="4"
      ><other-stu
        :direction="stuList[0].direction"
        :s_name="stuList[0].s_name"
        :p_string="stuList[1].p_string"
      ></other-stu
    ></at-flex-item>
    <at-flex-item :size="4"
      ><other-stu
        :direction="stuList[1].direction"
        :s_name="stuList[1].s_name"
        :p_string="stuList[1].p_string"
      ></other-stu
    ></at-flex-item>
    <at-flex-item :size="4"
      ><other-stu
        :direction="stuList[2].direction"
        :s_name="stuList[2].s_name"
        :p_string="stuList[2].p_string"
      ></other-stu
    ></at-flex-item>
  </at-flex>
  <at-flex>
    <at-flex-item :size="4"
      ><other-stu
        :direction="stuList[3].direction"
        :s_name="stuList[3].s_name"
        :p_string="stuList[3].p_string"
      ></other-stu
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
      ><other-stu
        :direction="stuList[4].direction"
        :s_name="stuList[4].s_name"
        :p_string="stuList[4].p_string"
      ></other-stu
    ></at-flex-item>
  </at-flex>
  <at-flex>
    <at-flex-item :size="4"
      ><other-stu
        :direction="stuList[5].direction"
        :s_name="stuList[5].s_name"
        :p_string="stuList[5].p_string"
      ></other-stu
    ></at-flex-item>
    <at-flex-item :size="4"
      ><other-stu
        :direction="stuList[6].direction"
        :s_name="stuList[6].s_name"
        :p_string="stuList[6].p_string"
      ></other-stu
    ></at-flex-item>
    <at-flex-item :size="4"
      ><other-stu
        :direction="stuList[7].direction"
        :s_name="stuList[7].s_name"
        :p_string="stuList[7].p_string"
      ></other-stu
    ></at-flex-item>
  </at-flex>
  <at-curtain :isOpened="ifShowHelp" @close="closeHelp">
    <view class="help-container">
      <text class="help-head">操作指南</text>
      <text class="help-content">1. 选择一个相邻(无视走道)的位置。</text>
      <text class="help-content">2. 选择该位置是否有同学。</text>
      <text class="help-content"
        >3. 如果该位置有同学则通过小程序扫Ta的身份码来进行位置关联。</text
      >
    </view>
  </at-curtain>
</template>
<script>
import { ref } from "vue";
import "./index.scss";
import Taro from "@tarojs/taro";
import {
  AtAvatar,
  AtFlex,
  AtFlexItem,
  AtButton,
  AtCurtain,
} from "taro-ui-vue3";
import QRCode from "../../utils/weapp-qrcode.js";
import OtherStu from "./OtherStu";
export default {
  components: {
    AtFlexItem,
    AtCurtain,
    AtButton,
    AtAvatar,
    AtFlex,
    OtherStu,
  },
  mounted() {
    let ss_data = { id: "123456", name: "同学" };
    try {
      ss_data.name = Taro.getStorageSync("s_name");
      ss_data.id = Taro.getStorageSync("s_id");
    } catch (e) {
      console.log("getStorageSync fail", e);
    }
    this.setData(ss_data)
    this.geneQR("dd$" + JSON.stringify(ss_data));
    this.GetWebSocket();
    let r = 1;
    wx.getSystemInfo({
      success: function (res) {
        //获取平台差异
        console.log("手机平台:" + res.platform);
        if (res.platform == "ios") {
          console.log("ios!!!");
          r = -1;
        }
      },
    });
    // TODO: 当座位全部关联后关闭监听
    /**
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
      // console.log(res);
      // console.log(this.ifOpenQR)
      // console.log(this.ifAutoOpen)
      if (this.ifOpenQR == false) {
        if (r * res.beta > 20) {
          this.autoOpenQR(true);
          console.log("auto open");
        }
      } else {
        if (this.ifAutoOpen == true) {
          if (r * res.beta < 20) {
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
      { direction: "左前",p_string:"front_left", s_name: "左前" },
      { direction: "前面",p_string:"front", s_name: "前" },
      { direction: "右前",p_string:"front_right", s_name: "右前" },
      { direction: "左边",p_string:"left", s_name: "左" },
      { direction: "右边",p_string:"right", s_name: "右" },
      { direction: "左后",p_string:"rear_left", s_name: "左后" },
      { direction: "后面",p_string:"rear", s_name: "后" },
      { direction: "右后",p_string:"rear_right", s_name: "右后" },
    ]);
    const wsState = ref(0); //ws状态
    const ifReConnect = ref(false); //是否正在重连
    const s_name = ref("同学"); //用户姓名
    const s_id = ref("null"); //用户ID
    const ifShowCanvas = ref(true); //是否绘制qrcode
    const ifOpenQR = ref(false); //是否放大QR
    const QRpath = ref(""); //二维码路径
    const ifAutoOpen = ref(false); //是否是自动放大的
    const ifShowHelp = ref(false); //是否是自动放大的
    function setData(d){
      s_id.value = d.id;
      s_name.value = d.name
    }
    //生成二维码
    function geneQR(content) {
      ifShowCanvas.value = true;
      console.log("生成二维码：", content);
      let QR_size = wx.getSystemInfoSync().windowWidth / 3;
      new QRCode("myQrcode2", {
        text: content,
        width: QR_size,
        height: QR_size,
        padding: 0, // 生成二维码四周自动留边宽度，不传入默认为0
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
        url: "wss://eclass.idealbroker.cn/ws/1/" + s_id._rawValue,
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
    //显示帮助
    function showHelp() {
      console.log("打开提示");
      ifShowHelp.value = true;
    }
    //关闭帮助
    function closeHelp() {
      console.log("关闭提示");
      ifShowHelp.value = false;
      stuList.value = [
        { direction: "左前", s_name: "1" },
        { direction: "前面", s_name: "2" },
        { direction: "右前", s_name: "3" },
        { direction: "左边", s_name: "4" },
        { direction: "右边", s_name: "5" },
        { direction: "左后", s_name: "6" },
        { direction: "后面", s_name: "7" },
        { direction: "右后", s_name: "8" },
      ];
    }
    return {
      GetWebSocket,
      stateList,
      stuList,
      reConnect,
      ifReConnect,
      ifShowCanvas,
      ifShowHelp,
      ifOpenQR,
      geneQR,
      autoOpenQR,
      ifAutoOpen,
      openQR,
      QRpath,
      wsState,
      s_name,
      showHelp,
      closeHelp,
      setData
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
.help-container {
  width: 100%;
  height: auto;
  padding-bottom: 2.4rem;
  border-radius: 8vw;
  background-color: #e5e5e5;
  display: flex;
  flex-direction: column;
}
.help-head {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 1.5rem;
}
.help-content {
  margin-left: 1.5rem;
  margin-right: 1.5rem;
  margin-top: 1.2rem;
  line-height: 2.4rem;
  font-size: 0.9rem;
}
</style>
