<template>
  <view class="head-container">
    <at-avatar size="large" image="https://jdc.jd.com/img/600"></at-avatar>
     <text class="welcome-text">{{ msg+"，欢迎进入！" }}</text>
  </view>
  <at-flex>
    <at-flex-item :size="4"><other-stu s_name="空"></other-stu></at-flex-item>
    <at-flex-item :size="4"><other-stu s_name="前"></other-stu></at-flex-item>
    <at-flex-item :size="4"><other-stu s_name="空"></other-stu></at-flex-item>
  </at-flex>
  <at-flex>
    <at-flex-item :size="4"><other-stu s_name="左"></other-stu></at-flex-item>
    <at-flex-item :size="4">
      <canvas
      canvas-id="myQrcode2"
      style="background: #fff; width: auto; height: 33vw"
    />
    </at-flex-item>
    <at-flex-item :size="4"><other-stu s_name="右"></other-stu></at-flex-item>
  </at-flex>
  <at-flex>
    <at-flex-item :size="4"><other-stu s_name="空"></other-stu></at-flex-item>
    <at-flex-item :size="4"><other-stu s_name="后"></other-stu></at-flex-item>
    <at-flex-item :size="4"><other-stu s_name="空"></other-stu></at-flex-item>
  </at-flex>
</template>

<script>
import { ref } from "vue";
import "./index.scss";
import { AtAvatar, AtFlex, AtFlexItem } from "taro-ui-vue3";
import QRCode from "../../utils/weapp-qrcode.js";
import OtherStu  from "./OtherStu";
export default {
  components: {
    AtFlexItem,
    AtAvatar,
    AtFlex,
    OtherStu
  },
  mounted(){
    console.log("on mounted")
    this.geneQR("{id:123123}")
  },
  setup() {
    const msg = ref("同学");
    const QRpath = ref("")
    //生成二维码
    function geneQR(content) {
      console.log("生成二维码：", content);
      let QR_size = wx.getSystemInfoSync().windowWidth/3
      new QRCode("myQrcode2", {
        text: content,
        width: QR_size,
        height: QR_size,
        padding: 12, // 生成二维码四周自动留边宽度，不传入默认为0
        correctLevel: QRCode.CorrectLevel.L, // 二维码可辨识度
        callback: (res) => {
          console.log(res.path);
          QRpath.value = res.path
          // 接下来就可以直接调用微信小程序的api保存到本地或者将这张二维码直接画在海报上面去
        },
      });
    }
    return {
      geneQR,
      QRpath,
      msg,
    };
  },
};
</script>
<style>
.head-container{
  margin: 5vw;
  display: flex;
  align-items: center;
}
.welcome-text{
  margin-left: 40px;
  font-size: 40px;
  font-weight: bold;
}
</style>
