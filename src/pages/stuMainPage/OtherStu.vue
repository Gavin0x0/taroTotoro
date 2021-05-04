<template>
  <view class="vw-33 flex-center" @tap="add">
    <at-avatar
      :text="s_data.s_name"
      style="color: #454545; background-color: #34343434"
    ></at-avatar>
    <text class="oth-stu-name"> 点击添加关联 </text>
  </view>
  <at-action-sheet
    cancelText="取消"
    :isOpened="isOpened"
    :title="'你的'+s_data.direction+'是：'"
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

export default {
  name: "OtherStu",
  props: {
    s_data: { direction: String, s_name: String },
  },
  components: {
    AtAvatar,
    AtActionSheet,
    AtActionSheetItem,
  },
  setup() {
    const msg = ref("Hello world");
    const isOpened = ref(false);
    function add() {
      console.log("点击添加");
      isOpened.value = true;
    }
    function addStu() {}
    function addNull() {}
    function actionClose(){
      console.log("Action Closed!")
      isOpened.value = false;
    }
    return {
      msg,
      add,
      addStu,
      addNull,
      isOpened,
      actionClose
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
</style>