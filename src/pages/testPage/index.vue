<template>
  <view class="testPage">
    <text>{{ msg }}</text>
    <button @tap="LoginTest">Login测试</button>
    <button @tap="SocketTest">Socket测试</button>
    <button @tap="scanQR">扫描二维码</button>
    <text style="font-size: 10px">扫码结果:{{ QRcontent }}</text>
    <button @tap="geneQR(geneContent)">生成二维码</button>
    <input
      type="text"
      placeholder="输入要生成的内容"
      :onInput="geneContentChanged"
    />
    <canvas
      v-if="geneContent"
      class="canvas-code"
      canvas-id="myQrcode"
      style="background: #fff; width: 100px; height: 100px"
    />
    <button @tap="openCamera()">
      {{ ifOpenCamera ? "关闭相机" : "启动相机" }}
    </button>
    <view v-if="ifOpenCamera">
      <view class="flex-wrp flex-wrp-row">
        <camera
          device-position="front"
          flash="off"
          binderror="error"
          style="width: 100%; height: 200px"
        ></camera>
        <image mode="widthFix" :src="imgPath"></image>
      </view>
      <button type="primary" @tap="takePhoto">拍摄头像</button>
      <text style="font-size: 10px">图片路径:{{ imgPath }}</text>
    </view>
    <button @tap="addStudent(0,0)">添加学生</button>
    <button @tap="loadCanvas()">加载头像并绘制</button>
    <slider
      step="1"
      value="100"
      show-value="true"
      min="10"
      max="100"
      :onChanging="zoomCanvas"
    />
    <canvas
      style="width: 100%; height: 800rpx"
      canvas-id="classroomCanvas"
      disable-scroll="true"
      :onTouchmove="TouchMove"
      :onTouchstart="TouchStart"
      :onTouchend="TouchEnd"
    ></canvas>
  </view>
</template>

<style>
.flex-wrp {
  display: flex;
}
.flex-wrp-row {
  flex-direction: row;
  padding: 20px;
  background: #f1f1f1;
}
</style>

<script>
import Taro from "@tarojs/taro";
import { ref } from "vue";
import QRCode from "../../utils/weapp-qrcode.js";
import "./index.scss";

export default {
  setup() {
    const msg = ref("各接口测试");
    const QRcontent = ref("null"); //扫描的二维码的内容
    const geneContent = ref(null); //生成的二维码的内容
    const touchStartXY = ref([0, 0]); //触摸起始点
    const touchSetXY = ref([0, 0]); //触摸结束点「放置位置」
    const zoomScale = ref(1); //缩放大小
    const avatarData = ref(null); //头像数据
    const studentsList = ref([]);
    const imgPath = ref(
      "https://tva1.sinaimg.cn/large/007e6d0Xgy1gpfyji5mioj30ip0ipjrd.jpg"
    );
    const ifOpenCamera = ref(false);
    //调起小程序API扫码
    function scanQR() {
      Taro.scanCode({
        onlyFromCamera: true,
        success: (res) => {
          console.log(res);
          QRcontent.value = res;
        },
      });
    }
    //改变生成的内容
    function geneContentChanged(res) {
      console.log(res);
      geneContent.value = res.detail.value;
    }
    //生成二维码
    function geneQR(content) {
      console.log("生成二维码：", content);
      new QRCode("myQrcode", {
        text: content,
        width: 100,
        height: 100,
        padding: 12, // 生成二维码四周自动留边宽度，不传入默认为0
        correctLevel: QRCode.CorrectLevel.L, // 二维码可辨识度
        callback: (res) => {
          console.log(res.path);
          // 接下来就可以直接调用微信小程序的api保存到本地或者将这张二维码直接画在海报上面去
        },
      });
    }
    //启动相机
    function openCamera() {
      ifOpenCamera.value = !ifOpenCamera.value;
    }
    //拍摄头像
    function takePhoto() {
      const ctx = wx.createCameraContext();
      ctx.takePhoto({
        quality: "high",
        success: (res) => {
          imgPath.value = res.tempImagePath;
          console.log("拍摄成功", res.tempImagePath);
        },
      });
    }
    //加载头像到本地
    function loadCanvas() {
      touchSetXY.value=[0,0] //初始点归位
      const ctx = wx.createCanvasContext("classroomCanvas");
      wx.getImageInfo({
        src: imgPath.value,
        success(res) {
          console.log(res.width);
          console.log(res.height);
          console.log(res.path);
          avatarData.value = res;
          CanvasClassroom(res, ctx, 10, 10);
          ctx.draw();
        },
      });
    }
    //添加学生
    function addStudent(row, column) {
      console.log(studentsList.value.findIndex(findSeat));
      if (studentsList.value.findIndex(findSeat) !== -1) {
        console.log("该位置已有人，添加失败", [row, column]);
        addStudent(row+1,column) //如果已占，则往后加「测试用」
      } else {
        studentsList.value.push([row, column]);
        console.log("添加了一个学生");
      }
      console.log("当前学生：", studentsList._rawValue);
      //二维数组查找
      function findSeat(ter) {
        return ter[0] == row && ter[1] == column;
      }
    }
    //Canvas绘图
    function CanvasClassroom(avatarRes, ctx, transX, transY) {
      //设置缩放
      ctx.transform(zoomScale._rawValue, 0, 0, zoomScale._rawValue, 0, 0);
      //drawImage(图片路径, 图片选择框起始x, 图片选择框起始y, 图片选择框宽度, 图片选择框高度, 放置位置x, 放置位置y, 放置宽度, 放置高度)
      let mapList = studentsList._rawValue;
      for (let i in mapList) {
        CanvasStudent(
          avatarRes,
          ctx,
          transX,
          transY,
          mapList[i][0],
          mapList[i][1]
        );
      }
    }
    //绘制个人位置
    function CanvasStudent(avatarRes, ctx, transX, transY, row, column) {
      ctx.drawImage(
        avatarRes.path,
        0,
        0,
        avatarRes.width,
        avatarRes.height,
        transX + 110 * column,
        transY + 110 * row,
        100,
        100
      );
    }

    //移动画布
    //开始触摸
    function TouchStart(e) {
      console.log("触摸开始", e);
      touchStartXY.value = [e.touches[0].x, e.touches[0].y];
    }
    //手指移动
    function TouchMove(e) {
      const ctx = wx.createCanvasContext("classroomCanvas");
      if (e.touches.length == 1) {
        console.log("单指触摸", e.touches);
        let transX =
          e.touches[0].x - touchStartXY._rawValue[0] + touchSetXY._rawValue[0];
        let transY =
          e.touches[0].y - touchStartXY._rawValue[1] + touchSetXY._rawValue[1];
        //CanvasContext.transform(number scaleX, number skewX, number skewY, number scaleY, number translateX, number translateY)
        console.log("位移X：", transX, "位移Y：", transY);
        CanvasClassroom(avatarData._rawValue, ctx, transX, transY);
        ctx.draw();
      } else {
        console.log("多指触摸", e.touches);
      }
    }
    //结束触摸
    function TouchEnd(e) {
      console.log("触摸结束", e.changedTouches);
      touchSetXY.value = [
        e.changedTouches[0].x -
          touchStartXY._rawValue[0] +
          touchSetXY._rawValue[0],
        e.changedTouches[0].y -
          touchStartXY._rawValue[1] +
          touchSetXY._rawValue[1],
      ];
      console.log("新起始点：", touchSetXY);
    }
    //改变缩放
    function zoomCanvas(e) {
      touchSetXY.value=[0,0] //初始点归位
      console.log(e.detail.value);
      zoomScale.value = e.detail.value / 100;
      const ctx = wx.createCanvasContext("classroomCanvas");
      CanvasClassroom(avatarData._rawValue, ctx, 0, 0);
      ctx.draw();
    }
    //Login测试
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
            });
          } else {
            console.log("登录失败！" + res.errMsg);
          }
        },
      });
    }
    //Socket测试
    function SocketTest() {
      Taro.connectSocket({
        url: "wss://eclass.idealbroker.cn/ws/1/1",
        success: function () {
          console.log("connect success");
        },
      }).then((task) => {
        task.onOpen(function () {
          console.log("onOpen");
          task.send({ data: "xxx" });
        });
        task.onMessage(function (msg) {
          console.log("onMessage: ", msg);
          task.close();
        });
        task.onError(function () {
          console.log("onError");
        });
        task.onClose(function (e) {
          console.log("onClose: ", e);
        });
      });
    }

    return {
      msg,
      QRcontent,
      geneContent,
      scanQR,
      geneQR,
      geneContentChanged,
      openCamera,
      takePhoto,
      imgPath,
      ifOpenCamera,
      loadCanvas,
      addStudent,
      TouchStart,
      TouchMove,
      TouchEnd,
      zoomCanvas,
      SocketTest,
      LoginTest,
    };
  },
};
</script>
