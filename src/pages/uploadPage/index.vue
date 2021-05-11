<template>
  <view>
    <text>
      {{ loginState }}
    </text>
    <at-form style="padding-bottom: 10px">
      <view v-if="!ifStart" class="flex-wrp flex-wrp-center">
        <image
          mode="scaleToFill"
          src="../../assets/face.png"
          style="width: 90vw; height: 90vw"
          @tap="openCamera"
        ></image>
      </view>
      <view class="flex-wrp flex-wrp-center" v-if="ifStart">
        <camera
          v-if="ifOpenCamera"
          device-position="front"
          flash="off"
          binderror="error"
          style="width: 70vw; height: 70vw"
        ></camera>
        <view v-if="!ifOpenCamera">
          <image
            mode="scaleToFill"
            :src="imgPath"
            style="width: 70vw; height: 70vw"
          ></image>
        </view>
        <at-button type="primary" @click="takePhoto" style="margin-top: 20px">
          {{ ifOpenCamera ? "拍摄头像" : "重新拍摄" }}
        </at-button>
      </view>
      <at-input
        name="s_name"
        title="姓名"
        type="text"
        placeholder="请输入姓名"
        v-model:value="formData.name"
      />
      <at-input
        name="s_id"
        title="学号"
        type="number"
        placeholder="请输入学号，例：104XXXXX"
        v-model:value="formData.id"
      />
      <at-button
        formType="submit"
        @click="onSubmit"
        style="margin: 10px"
        type="primary"
        >进入教室</at-button
      >
      <at-button
        formType="reset"
        @click="onReset"
        style="margin: 10px"
        type="secondary"
        >重置</at-button
      >
    </at-form>
  </view>
</template>

<script>
import Taro from "@tarojs/taro";
import { AtForm, AtInput, AtButton, AtMessage } from "taro-ui-vue3";
import { ref } from "vue";
import "./index.scss";
export default {
  name: "uploadPage",
  components: {
    AtForm,
    AtInput,
    AtButton,
    AtMessage,
  },
  mounted() {
    this.LoginTest();
  },
  setup() {
    const ifStart = ref(false); //是否开始拍摄
    const ifOpenCamera = ref(false); //是否开启摄像头
    const imgPath = ref(""); //头像数据
    const formData = ref({
      name: "",
      id: "",
    });
    const loginState = ref("未判断");
    //静默登陆
    function LoginTest() {
      Taro.login({
        success: function (res) {
          console.log("Login:", res);
          if (res.code) {
            //发起网络请求
            Taro.request({
              url: "https://eclass.idealbroker.cn/login",
              method: "POST",
              header: {
                "content-type": "application/x-www-form-urlencoded",
              },
              data: {
                code: res.code,
              },
              success: function (res) {
                console.log(res.data);
                loginState.value = res.data.is_new_user;
              },
            });
          } else {
            console.log("用户凭证获取失败！" + res.errMsg);
          }
        },
      });
    }
    //启动相机
    function openCamera() {
      console.log("开始拍摄");
      ifStart.value = true;
      ifOpenCamera.value = true;
    }
    //拍摄头像
    function takePhoto() {
      if (ifOpenCamera._rawValue) {
        const ctx = wx.createCameraContext();
        ctx.takePhoto({
          quality: "high",
          success: (res) => {
            imgPath.value = res.tempImagePath;
            console.log("拍摄成功", res.tempImagePath);
            ifOpenCamera.value = false;
          },
        });
      } else {
        ifOpenCamera.value = true;
      }
    }
    //表单验证,成功则返回空，错误则返回提示文字
    function formValidation() {
      console.log("进行了一次表单验证");
      let validationText = "";
      if (formData.value.id == "") {
        validationText = "未填写学号";
      }
      if (formData.value.name == "") {
        validationText = "未填写姓名";
      }
      if (imgPath.value == "") {
        validationText = "未拍摄头像";
      }
      return validationText;
    }
    function onSubmit(event) {
      let V_result = formValidation();
      if (!V_result) {
        console.log(formData.value);
        Taro.uploadFile({
          url: "https://eclass.idealbroker.cn/add", //仅为本地测试，非真实的接口地址
          filePath: imgPath.value,
          name: "file",
          formData: {
            name: formData.value.name,
            id: formData.value.id,
          },
          success(res) {
            console.log("success", res.data);
            try {
              Taro.setStorageSync("s_name", formData.value.name);
              Taro.setStorageSync("s_id", formData.value.id);
            } catch (e) {
              console.log("setStorageSync fail",e)
            }
            Taro.reLaunch({
              url: "/pages/stuMainPage/index",
            });
          },
          fail(res) {
            console.log("error", res);
          },
        });
      } else {
        wx.showToast({
          title: V_result,
          icon: "error",
          duration: 2000,
        });
      }
    }
    function onReset(event) {
      ifStart.value = false;
      ifOpenCamera.value = false;
      formData.value = {
        name: "",
        id: "",
      };
    }
    return {
      ifStart,
      ifOpenCamera,
      openCamera,
      takePhoto,
      formData,
      onSubmit,
      onReset,
      imgPath,
      loginState,
      LoginTest,
    };
  },
};
</script>

<style>
.flex-wrp {
  display: flex;
}
.flex-wrp-center {
  width: 100%;
  height: 800px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
