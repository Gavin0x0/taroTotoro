<template>
  <view class="vw-33 flex-center" @tap="add">
    <view class="my-avatar" :style="bgColor[bgColorType]">{{
      avatar_text
    }}</view>
    <text class="oth-stu-name">{{ s_name_text }}</text>
  </view>
  <at-action-sheet
    cancelText="取消"
    :isOpened="isOpened"
    :title="'你的' + direction + '是：'"
    :onClose="actionClose"
  >
    <at-action-sheet-item @click="addStu"> 同学 </at-action-sheet-item>
    <at-action-sheet-item @click="addNull"> 没有人 </at-action-sheet-item>
  </at-action-sheet>
</template>

<script>
import { ref } from "vue";
import "./index.scss";
import { AtAvatar, AtActionSheet, AtActionSheetItem } from "taro-ui-vue3";
import Taro from "@tarojs/taro";
export default {
  name: "OtherStu",
  props: {
    direction: String,
    s_name: String,
  },
  components: {
    AtAvatar,
    AtActionSheet,
    AtActionSheetItem,
  },
  setup(props) {
    //背景颜色 [0:未关联，1:已关联，2:空位]
    const bgColor = [
      "color: #3F536E; background-color: #34343434",
      "color: #FAFBFC; background-color: #78A4FA",
      "color: #3F536E; background-color: #FAFBFC",
    ];
    const bgColorType = ref(0);
    const msg = ref("Hello world");
    const s_name_text = ref("点击添加关联");
    const avatar_text = ref(props.s_name);
    const isOpened = ref(false);
    function add() {
      console.log("点击添加");
      isOpened.value = true;
    }
    function addStu() {
      Taro.scanCode({
        onlyFromCamera: true,
        success: (res) => {
          isOpened.value = false;
          console.log("Scan Result:", res.result);
          try {
            let data = JSON.parse(res.result.split("$")[1]);
            console.log(data);
            console.log("添加同学" + data.name + ":" + data.id);
            s_name_text.value = "已设置：" + data.name;
            avatar_text.value = data.name.substring(0, 1);
            bgColorType.value = 1;
          } catch (error) {
            console.log("参数非法");
            wx.showToast({
              title: "非法身份码",
              icon: "error",
              duration: 1000,
            });
          }
        },
      });
    }
    function addNull() {
      console.log("添加空位");
      s_name_text.value = "已设置：空位";
      avatar_text.value = "空";
      console.log("avatar_text：", avatar_text.value);
      bgColorType.value = 2;
      isOpened.value = false;
    }
    function actionClose() {
      console.log("Action Closed!");
      isOpened.value = false;
    }
    return {
      msg,
      add,
      s_name_text,
      addStu,
      addNull,
      isOpened,
      actionClose,
      bgColorType,
      bgColor,
      avatar_text,
    };
  },
};
</script>

<style>
.vw-33 {
  width: auto;
  height: 33vw;
}
.flex-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  align-items: center;
}
.oth-stu-name {
  margin-top: 40px;
  font-size: 28px;
}
.color-test {
  color: #edf8fa;
}
.my-avatar {
  width: 100rpx;
  height: 100rpx;
  color: #fff;
  font-size: 40rpx;
  line-height: 100rpx;
  text-align: center;
  border-radius: 8rpx;
  background: #e5e5e5;
  -webkit-box-shadow: 0 0 50rpx 0 rgba(0, 0, 0, 0.05);
  box-shadow: 0 0 50rpx 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
</style>