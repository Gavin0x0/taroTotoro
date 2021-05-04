<template>
  <view style="background-color:#32323232" class="vw-33 flex-center">
    <at-avatar
      :text="s_name"
      style="color: #454545; background-color: #969696"
    ></at-avatar>
    <text class="oth-stu-name">
        点击添加关联
    </text>
  </view>
</template>

<script>
import { ref } from "vue";
import "./index.scss";
import { AtAvatar } from "taro-ui-vue3";
export default {
  name: "OtherStu",
  props: {
    s_name:String,
  },
  components: {
    AtAvatar,
  },
  setup() {
    const msg = ref("Hello world");
    return {
      msg,
    };
  },
};
</script>

<style>
.vw-33{
    width: auto;
    height: 33vw;
}
.flex-center{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
    align-items: center;
}
.oth-stu-name{
    margin-top: 40px;
    font-size: 28px;
}
</style>