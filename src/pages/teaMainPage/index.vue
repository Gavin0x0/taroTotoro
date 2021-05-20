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
  <view class="stu-num-container" @tap="canvasUtils">
    <view>
      <text class="ws-text">{{ "已加入教室：" }}</text>
      <text class="num-text" style="margin-right: 0.3em">{{
        entry_stu_num
      }}</text>
      <text class="ws-text">人</text>
    </view>
    <view>
      <text class="ws-text">{{ "已关联位置：" }}</text>
      <text class="num-text" style="margin-right: 0.3em">{{
        located_stu_num
      }}</text>
      <text class="ws-text">人</text>
    </view>
  </view>
  <view class="notice-container easy-animation">
    <at-noticebar
      showMore
      :single="ifShowSingle"
      :moreText="ifShowSingle ? '查看更多' : '点击收起'"
      :onGotoMore="onclickShowMore"
      style="white-space: pre-wrap"
      class="easy-animation"
      >{{ notice }}</at-noticebar
    >
  </view>
  <canvas
    class="classroom-canvas"
    type="2d"
    id="classroomCanvas"
    disable-scroll="true"
    :onTouchmove="TouchMove"
    :onTouchstart="TouchStart"
    :onTouchend="TouchEnd"
  ></canvas>
</template>
<script>
import { ref, onMounted, onBeforeUpdate } from "vue";
import "./index.scss";
import Taro from "@tarojs/taro";
import { AtAvatar, AtButton, AtNoticebar } from "taro-ui-vue3";
export default {
  components: {
    AtButton,
    AtAvatar,
    AtNoticebar,
  },
  onReady() {
    console.log("on ready");
    //this.canvasUtils(); //获取canvas「出错」
    this.GetWebSocket();
    this.loadImg();
  },
  setup() {
    //FIXME 由于框架的问题，无法在onReady()生命周期取到canvas，希望之后可以被修复
    /**
        目标写法：
        onReady() {
          console.log("on ready");
          this.canvasUtils() //获取canvas「出错」
          this.GetWebSocket();
          this.loadImg();
        },
        当前折中的方案是设一个flag判断是否已获取到canvas,在onBeforeUpdate()中获取canvas
     */
    onBeforeUpdate(() => {
      if (!ifGotCanvas._rawValue) {
        canvasUtils();
      }
      console.log("Component is onBeforeUpdate!");
    });
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
    const total_stu_num = ref(0); //总人数
    const entry_stu_num = ref(30); //已经加入教室的人数
    const located_stu_num = ref(28); //已经关联位置的人数
    const notice = ref("通知栏消息：欢迎进入！"); //系统通知
    const ifShowSingle = ref(true); //是否显示单行
    const C_canvas = ref(null); //canvas实例
    const C_ctx = ref(null); //canvas绘制器
    const touchStartXY = ref([0, 0]); //触摸起始点
    const touchSetXY = ref([0, 0]); //触摸结束点「放置位置」
    const avaters = ref(null);
    const canvas_scal = ref(null); //canvas尺寸
    const ifGotCanvas = ref(false);

    //工具类，获取canvas
    function canvasUtils() {
      Taro.createSelectorQuery()
        .select("#classroomCanvas")
        .fields({
          node: true,
          size: true,
        })
        .exec((res) => {
          console.log("Select", res);
          if (res.length >= 1) {
            ifGotCanvas.value = true;
          }
          let canvasNode = res[0];
          let canvas = canvasNode.node;
          let ctx = canvas.getContext("2d");
          // 获取设备像素比调整画布尺寸，并缩放坐标系
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = canvasNode.width * dpr;
          canvas.height = canvasNode.height * dpr;

          // 设置 canvas 坐标原点 「暂不设置」
          //ctx.translate(canvas.width / 2, canvas.height / 2);
          canvas_scal.value = [canvasNode.width, canvasNode.height];
          console.log("CanvasNode scal:", canvasNode.width, canvasNode.height);
          console.log("Canvas scal:", canvas_scal.value);
          ctx.scale(dpr, dpr);

          console.log(canvas, ctx);
          C_canvas.value = canvas;
          C_ctx.value = ctx;
        });
    }
    //清空画布
    function cleanAll(preserveTransform) {
      let canvas = C_canvas._rawValue;
      let ctx = C_ctx._rawValue;
      if (preserveTransform) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (preserveTransform) {
        ctx.restore();
      }
    }

    //加载头像
    function loadImg() {
      //let canvas = C_canvas._rawValue;
      const canvas = wx.createOffscreenCanvas({
        type: "2d",
        width: 150,
        height: 150,
      });
      const img = canvas.createImage();
      img.src =
        "https://tva1.sinaimg.cn/large/007e6d0Xgy1gpfyji5mioj30ip0ipjrd.jpg";
      avaters.value = img;
    }

    //绘制测试
    function tryToDraw(x, y) {
      let ctx = C_ctx._rawValue;
      //ctx.clearRect(0, 0, 100, 100);
      cleanAll(true);
      ctx.drawImage(avaters.value, x, y, 40, 40);
    }
    //debug小球
    function drawBall(x, y, R, color) {
      let ctx = C_ctx._rawValue;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.strokeStyle = "rgba(1,1,1,0)";
      ctx.fill();
      ctx.stroke();
    }

    //开始触摸
    function TouchStart(e) {
      touchStartXY.value = [e.touches[0].x, e.touches[0].y];
      console.log("触摸开始", e.touches[0].x, e.touches[0].y);
      drawBall(e.touches[0].x, e.touches[0].y, 5, "#1aad19");
    }
    //计算偏移量，避免出界
    //TODO 出界计算要考虑已画内容大小
    function countLocation(X, Y) {
      let res_loc = [0, 0];
      res_loc[0] = X - touchStartXY._rawValue[0] + touchSetXY._rawValue[0];
      res_loc[1] = Y - touchStartXY._rawValue[1] + touchSetXY._rawValue[1];
      if (res_loc[0] < 0) {
        res_loc[0] = 0;
      } else if (res_loc[0] > canvas_scal._rawValue[0] - 40) {
        res_loc[0] = canvas_scal._rawValue[0] - 40;
      }
      if (res_loc[1] < 0) {
        res_loc[1] = 0;
      } else if (res_loc[1] > canvas_scal._rawValue[1] - 40) {
        res_loc[1] = canvas_scal._rawValue[1] - 40;
      }
      return res_loc;
    }
    //手指移动
    function TouchMove(e) {
      let ctx = C_ctx._rawValue;
      if (e.touches.length == 1) {
        console.log("单指触摸", e.touches[0].x, e.touches[0].y);
        let location = countLocation(e.touches[0].x, e.touches[0].y);
        //CanvasContext.transform(number scaleX, number skewX, number skewY, number scaleY, number translateX, number translateY)
        console.log("位移至X：", location[0], "位移至Y：", location[1]);
        drawBall(location[0], location[1], 2, "#b47fd8");
        tryToDraw(location[0], location[1]);
        // CanvasClassroom(avatarData._rawValue, ctx, transX, transY);
        // ctx.draw();
        drawBall(e.touches[0].x, e.touches[0].y, 2, "#7fd8c9");
      } else {
        console.log("多指触摸", e.touches);
      }
    }
    //结束触摸
    function TouchEnd(e) {
      console.log("触摸结束", e.changedTouches[0].x, e.changedTouches[0].y);
      touchSetXY.value = countLocation(
        e.changedTouches[0].x,
        e.changedTouches[0].y
      );
      drawBall(e.changedTouches[0].x, e.changedTouches[0].y, 5, "#ff5252");
      console.log(
        "新起始点：",
        touchSetXY._rawValue[0],
        touchSetXY._rawValue[1]
      );
      drawBall(touchSetXY._rawValue[0], touchSetXY._rawValue[1], 5, "#b47fd8");
    }
    //更新通知
    function AddNotice(new_notice) {
      let nowTime = new Date().toString().split(" ")[4];
      console.log(nowTime);
      notice.value = nowTime + "-" + new_notice + "\n" + notice._rawValue;
    }
    function onclickShowMore() {
      ifShowSingle.value = !ifShowSingle._rawValue;
    }

    //连接Websocket
    function GetWebSocket() {
      ifReConnect.value = true;
      Taro.connectSocket({
        url: "ws://123.207.136.134:9010/ajaxchattest",
        success: function () {
          console.log("connect success");
          AddNotice("系统消息：服务器连接成功");
        },
        fail: function () {
          ifReConnect.value = false;
          console.log("connect fail");
          AddNotice("系统消息：服务器连接成功");
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
          AddNotice(nowDate + "服务器消息：" + msg);
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
          AddNotice("系统消息：服务器连接断开");
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
      entry_stu_num,
      located_stu_num,
      notice,
      ifShowSingle,
      onclickShowMore,
      canvasUtils,
      tryToDraw,
      loadImg,
      TouchStart,
      TouchMove,
      TouchEnd,
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
.notice-container {
  margin: 0 5vw 0 5vw;
}
.stu-num-container {
  margin: 5vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.num-text {
  font-size: 50px;
  font-weight: bolder;
}
.easy-animation {
  transition: 1s ease;
}
.classroom-canvas {
  width: 100%;
  height: 800rpx;
  border-top: 10px solid #6190e8;
  border-bottom: 10px solid #6190e8;
  box-sizing: border-box;
  margin-top: 20px;
}
</style>
