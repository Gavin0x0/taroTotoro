<template>
  <view class="testPage">
    <text>{{ msg }}</text>
    <button @tap="LoginTest">Login测试</button>
    <button @tap="SocketTest">Socket测试</button>
    <button @tap="CheckSession">Session测试</button>

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
          style="width: 50%; height: 200px"
        ></camera>
        <image mode="widthFix" :src="imgPath"></image>
      </view>
      <button type="primary" @tap="takePhoto">拍摄头像</button>
      <text style="font-size: 10px">图片路径:{{ imgPath }}</text>
    </view>
    <button @tap="canvasUtils">获取canvas</button>
    <button @tap="tryToDraw">try add</button>
    <button @tap="tryToMove">try move</button>
    <button @tap="openAddModal">添加学生</button>
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
      type="2d"
      id="classroomCanvas"
      disable-scroll="true"
      :onTouchmove="TouchMove"
      :onTouchstart="TouchStart"
      :onTouchend="TouchEnd"
    ></canvas>
    <cover-view>
      <at-modal :isOpened="ifOpenModal">
        <at-modal-header>Modal模态弹窗测试</at-modal-header>
        <at-modal-content>
          <text>将</text>
          <at-input
            name="addName"
            title=""
            type="text"
            placeholder="学生姓名"
            v-model:value="addName"
          />
          <text>添加在</text>
          <view>
            <text>行：</text>
            <at-input-number
              :width="100"
              :min="0"
              :max="40"
              :step="1"
              v-model:value="addPosition[0]"
            />
          </view>
          <view>
            <text>列：</text>
            <at-input-number
              :width="100"
              :min="0"
              :max="40"
              :step="1"
              v-model:value="addPosition[1]"
            />
          </view>
          <text>若已有人则置于下一行</text>
        </at-modal-content>
        <at-modal-action :isSimple="false">
          <button @tap="closeAddModal">取消</button>
          <button @tap="addStudent(addPosition[0], addPosition[1], addName)">
            确定
          </button>
        </at-modal-action>
      </at-modal>
    </cover-view>
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
//import QRCode from "../../utils/weapp-qrcode.js";
import "./index.scss";
//taro UI 对应的CSS在index.scss文件里
import {
  AtInput,
  AtModal,
  AtModalHeader,
  AtModalContent,
  AtModalAction,
  AtInputNumber,
} from "taro-ui-vue3";

export default {
  components: {
    AtInput,
    AtModal,
    AtModalHeader,
    AtModalContent,
    AtModalAction,
    AtInputNumber,
  },
  setup() {
    const msg = ref("各接口测试");
    const QRcontent = ref("null"); //扫描的二维码的内容
    const geneContent = ref(null); //生成的二维码的内容
    const touchStartXY = ref([0, 0]); //触摸起始点
    const touchSetXY = ref([0, 0]); //触摸结束点「放置位置」
    const zoomScale = ref(1); //缩放大小
    const avatarData = ref(null); //头像数据
    const studentsList = ref([]); //学生列表
    const addName = ref("Jack"); //学生姓名
    const imgPath = ref(
      "https://tva1.sinaimg.cn/large/007e6d0Xgy1gpfyji5mioj30ip0ipjrd.jpg"
    ); //头像数据
    const ifOpenCamera = ref(false); //是否开启摄像头
    const ifOpenModal = ref(false); //是否打开弹窗
    const addPosition = ref([0, 0]); //添加学生的位置
    const C_canvas = ref(null);
    const C_ctx = ref(null);

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
    //工具类，获取canvas
    async function canvasUtils() {
      // 取 canvas 节点
      // 此处使用 await
      let canvasNode = await new Promise((resolve, reject) => {
        // 注意：若canvas是定义在在组件内，需改用
        // const query = wx.createSelectorQuery().in(this)
        const query = wx.createSelectorQuery();
        query
          .select("#classroomCanvas")
          .fields({ node: true, size: true })
          .exec((res) => {
            resolve(res[0]);
          });
      });
      let canvas = canvasNode.node,
        ctx = canvas.getContext("2d");
      // 获取设备像素比调整画布尺寸，并缩放坐标系
      const dpr = wx.getSystemInfoSync().pixelRatio;
      canvas.width = canvasNode.width * dpr;
      canvas.height = canvasNode.height * dpr;

      // 设置 canvas 坐标原点
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(dpr, dpr);
      console.log(canvas, ctx);
      C_canvas.value = canvas;
      C_ctx.value = ctx;
    }
    //绘制测试
    function tryToDraw() {
      let ctx = C_ctx._rawValue;
      let canvas = C_canvas._rawValue;
      const img = canvas.createImage();
      img.src = imgPath.value;
      ctx.drawImage(img, 0, 0, 100, 100);
    }
    function tryToMove() {
      let ctx = C_ctx._rawValue;
      // 清楚画布
      ctx.clearRect(-375, -400, 750, 750);
      // 保存当前帧，以备复原
      //ctx.save()
      // 画布旋转
      //ctx.rotate(30 / 180 * Math.PI);
      ctx.translate(-1, 1);
      tryToDraw();
      // 操作完后复原至 save 步骤
      //ctx.restore()
    }

    // //加载头像到本地
    // function loadCanvas() {
    //   wx.createSelectorQuery()
    //     .select("#classroomCanvas")
    //     .fields({
    //       node: true,
    //       size: true,
    //     })
    //     .exec(drawTest.bind(this));
    // }
    // function drawTest(res) {
    //   console.log(res);
    //   const canvas = res[0].node;
    //   const ctx = canvas.getContext("2d");
    //   touchSetXY.value = [0, 0]; //初始点归位
    //   //const ctx = wx.createCanvasContext("classroomCanvas");
    //   const img = canvas.createImage();
    //   // img.onload = () => {
    //   //   this._img = img;
    //   // };
    //   img.src = imgPath.value;
    //   CanvasClassroom(img, ctx, 10, 10);
    //   ctx.draw();

    // wx.getImageInfo({
    //   src: imgPath.value,
    //   success(res) {
    //     //console.log(res.width);
    //     //console.log(res.height);
    //     //console.log(res.path);
    //     avatarData.value = res;
    //     CanvasClassroom(res, ctx, 10, 10);
    //     ctx.draw();
    //   },
    // });
    //    }
    //打开添加弹窗
    function openAddModal() {
      ifOpenModal.value = true;
    }
    //关闭添加弹窗
    function closeAddModal() {
      ifOpenModal.value = false;
    }
    //添加学生
    // function addStudent(row, column, name) {
    //   console.log(studentsList.value.findIndex(findSeat));
    //   if (studentsList.value.findIndex(findSeat) !== -1) {
    //     console.log("该位置已有人，添加失败", [row, column]);
    //     addStudent(row + 1, column, name); //如果已占，则往后加「测试用」
    //   } else {
    //     studentsList.value.push([row, column, name]);
    //     console.log("添加了一个学生:", name);
    //   }
    //   console.log("当前学生：", studentsList._rawValue);
    //   //二维数组查找
    //   function findSeat(ter) {
    //     return ter[0] == row && ter[1] == column;
    //   }
    //   ifOpenModal.value = false;
    //   loadCanvas();
    // }
    //Canvas绘图
    // function CanvasClassroom(avatarRes, ctx, transX, transY) {
    //   //设置缩放
    //   ctx.transform(zoomScale._rawValue, 0, 0, zoomScale._rawValue, 0, 0);
    //   //drawImage(图片路径, 图片选择框起始x, 图片选择框起始y, 图片选择框宽度, 图片选择框高度, 放置位置x, 放置位置y, 放置宽度, 放置高度)
    //   let mapList = studentsList._rawValue;
    //   for (let i in mapList) {
    //     CanvasStudent(
    //       avatarRes,
    //       ctx,
    //       transX,
    //       transY,
    //       mapList[i][0], //row
    //       mapList[i][1], //column
    //       mapList[i][2] //name
    //     );
    //   }
    // }
    //绘制个人位置
    // function CanvasStudent(img, ctx, transX, transY, row, column, name) {
    //   ctx.drawImage(img, transX + 110 * column, transY + 140 * row, 100, 100);
    //   ctx.font = "normal normal 20px sans-serif";
    //   //ctx.setTextAlign("center");
    //   ctx.fillText(name, transX + 110 * column + 50, transY + 140 * row + 120);
    // }
    //移动画布
    //开始触摸
    function TouchStart(e) {
      console.log("触摸开始", e);
      touchStartXY.value = [e.touches[0].x, e.touches[0].y];
    }
    //手指移动
    function TouchMove(e) {
      let ctx = C_ctx._rawValue;
      if (e.touches.length == 1) {
        console.log("单指触摸", e.touches);
        let transX =
          e.touches[0].x - touchStartXY._rawValue[0] + touchSetXY._rawValue[0];
        let transY =
          e.touches[0].y - touchStartXY._rawValue[1] + touchSetXY._rawValue[1];
        //CanvasContext.transform(number scaleX, number skewX, number skewY, number scaleY, number translateX, number translateY)
        console.log("位移X：", transX, "位移Y：", transY);
        tryToMove();
        // CanvasClassroom(avatarData._rawValue, ctx, transX, transY);
        // ctx.draw();
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
      touchSetXY.value = [0, 0]; //初始点归位
      console.log(e.detail.value);
      zoomScale.value = e.detail.value / 100;
      const ctx = wx.createCanvasContext("classroomCanvas");
      CanvasClassroom(avatarData._rawValue, ctx, 0, 0);
      ctx.draw();
    }
    //接口测试
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
              success: function (res) {
                console.log(res.data);
              },
            });
          } else {
            console.log("用户凭证获取失败！" + res.errMsg);
          }
        },
      });
    }
    function CheckSession() {
      Taro.checkSession({
        success: function () {
          //session_key 未过期，并且在本生命周期一直有效
          console.log("未过期");
        },
        fail: function () {
          // session_key 已经失效，需要重新执行登录流程
          console.log("已过期，重新登录");
          LoginTest(); //重新登录
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
      //loadCanvas,
      //addStudent,
      //addName,
      TouchStart,
      TouchMove,
      TouchEnd,
      zoomCanvas,
      SocketTest,
      LoginTest,
      closeAddModal,
      openAddModal,
      ifOpenModal,
      addPosition,
      canvasUtils,
      tryToDraw,
      tryToMove,
      CheckSession,
    };
  },
};
</script>
