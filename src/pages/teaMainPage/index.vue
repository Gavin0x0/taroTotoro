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
  <view class="stu-num-container">
    <view @tap="canvasUtils">
      <text class="ws-text">{{ "已加入教室：" }}</text>
      <text class="num-text" style="margin-right: 0.3em">{{
        entry_stu_num
      }}</text>
      <text class="ws-text">人</text>
    </view>
    <view @tap="loadImg">
      <text class="ws-text">{{ "已关联位置：" }}</text>
      <text class="num-text" style="margin-right: 0.3em">{{
        located_stu_num
      }}</text>
      <text class="ws-text">人</text>
    </view>
  </view>
  <view class="stu-num-container" v-if="imgLoading">
    <at-activity-indicator
      :isOpened="imgLoading"
      content="新加入的用户加载中..."
    ></at-activity-indicator>
  </view>
  <canvas
    type="2d"
    id="classroomCanvas"
    class="classroom-canvas"
    disable-scroll="true"
    :onTouchmove="TouchMove"
    :onTouchstart="TouchStart"
    :onTouchend="TouchEnd"
  ></canvas>
  <view class="stu-num-container" v-if="selectedStu">
    <view>
      <text class="ws-text">{{ "当前选中：" }}</text>
      <text class="num-text" style="margin-right: 0.3em">{{
        selectedStu.stu_name
      }}</text>
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
</template>
<script>
import { ref, onBeforeUpdate, onMounted } from "vue";
import "./index.scss";
import Taro from "@tarojs/taro";
import {
  AtAvatar,
  AtButton,
  AtNoticebar,
  AtActivityIndicator,
} from "taro-ui-vue3";
export default {
  components: {
    AtButton,
    AtAvatar,
    AtNoticebar,
    AtActivityIndicator,
  },
  onReady() {
    console.log("on ready");
    this.canvasUtils(); //获取canvas「出错」
    this.GetWebSocket();
    this.loadImg();
  },
  setup() {
    //TODO 由于框架的问题，无法在onReady()生命周期取到canvas，等被官方团队修复再开放这个接口
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
    onMounted(() => {
      addMockStu();
      console.log(StuList);
      loadImg();
    });
    onBeforeUpdate(() => {
      if (!ifGotCanvas) {
        canvasUtils();
      }
      //loadImg();
      console.log("Component is onBeforeUpdate！！！！！！！!");
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
    const selectedStu = ref(null); //被选中的学生
    const imgLoading = ref(false); //是否正在加载图片
    //Canvas相关变量
    let touchStartXY = [0, 0]; //触摸起始点
    let touchSetXY = ref([0, 0]); //触摸结束点「放置位置」
    let canvas_size = null; //canvas尺寸
    let ifGotImg = false; //是否已经加载好图片资源
    let C_canvas = null; //canvas实例
    let C_ctx = null; //canvas绘制器
    let ifGotCanvas = false; //是否已获取到canvas
    let touchMode = 0; //设置触摸模式 1:单指 2:双指  如果已进入单指模式不可切换到双指 得先置零才能进入双指
    let touchesNum = 0; //屏幕上的手指数信号量
    let touch_init_Distance = 0; //双指间初始距离
    let change_Distance = 0; //双指间距离
    let canvas_init_scal = null; //缩放比初始值
    let canvas_scal = 1; //当前缩放比例
    let classroom_size = [0, 0]; //教室大小，宽度，高度
    const _avatar_size = 60; //定义 头像尺寸
    const _avatar_padding = 10; //定义 头像外边距
    const _name_height = 20; //定义 名字高度
    const _blackboard_height = 40; //定义 黑板占用高度
    const _classroom_border = 2; //定义 教室外轮廓宽度
    //逻辑内数据
    let StuList = []; //学生列表

    //TODO 扩充学生列表，测试用
    function addMockStu() {
      var Mock = require("mockjs");
      let size = 4;
      for (let i = 0; i <= size; i++) {
        for (let j = 0; j <= size; j++) {
          if (Mock.Random.boolean(4, 1, true)) {
            let mock_name = Mock.Random.cname();
            let stu = {
              stu_name: mock_name,
              avatar: null,
              avater_url: Mock.Random.image(
                "120x120",
                Mock.Random.color(),
                "#000",
              ),
              pos: [i, j],
            };
            StuList.push(stu);
          }
        }
      }
      classroom_size = [
        (size + 1) * (_avatar_size + _avatar_padding),
        (size + 1) * (_avatar_size + _avatar_padding + _name_height) +
          _blackboard_height,
      ]; //列人数*50，行数*50+20
    }

    //工具类，获取canvas
    function canvasUtils() {
      wx.createSelectorQuery()
        .select("#classroomCanvas")
        .fields({
          node: true,
          size: true,
        })
        .exec((res) => {
          console.log("Select", res);
          if (res[0] !== null) {
            ifGotCanvas = true;
            console.log("已获取到canvas");
          } else {
            console.log("未获取到canvas");
          }
          const canvasNode = res[0];
          const canvas = canvasNode.node;
          const ctx = canvas.getContext("2d");
          // 获取设备像素比调整画布尺寸，并缩放坐标系
          const dpr = wx.getSystemInfoSync().pixelRatio;
          console.log("设备dpr：", dpr);
          canvas.width = canvasNode.width * dpr;
          canvas.height = canvasNode.height * dpr;

          // 设置 canvas 坐标原点 「暂不设置」
          //ctx.translate(canvas.width / 2, canvas.height / 2);
          canvas_size = [canvasNode.width, canvasNode.height];
          console.log("CanvasNode scal:", canvasNode.width, canvasNode.height);
          console.log("Canvas scal:", canvas_size);
          ctx.scale(dpr, dpr);
          console.log(canvas, ctx);
          C_canvas = canvas;
          C_ctx = ctx;
        });
    }
    //清空画布
    function cleanAll(preserveTransform) {
      let canvas = C_canvas;
      let ctx = C_ctx;
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
      //TODO 目前很多设备还不支持离屏canvas 等以后再开放这个接口
      // 获取 context。注意这里必须要与创建时的 type 一致
      // const canvas = wx.createOffscreenCanvas({
      //   type: "2d",
      //   width: 150,
      //   height: 150,
      // });
      let needToLoad = [];
      for (let s in StuList) {
        if (StuList[s].avater == null) {
          let load = { num: s, avater_url: StuList[s].avater_url };
          needToLoad.push(load);
        }
      }
      if (!imgLoading._rawValue && needToLoad.length != 0) {
        imgLoading.value = true;
        if (ifGotCanvas) {
          let canvas = C_canvas;
          let img_num = needToLoad.length;
          let success_num = 0;
          let fail_num = 0;
          AddNotice("图片开始加载：" + img_num);
          for (let s in needToLoad) {
            const img = canvas.createImage();
            // 等待图片加载
            img.onload = () => {
              console.log("图片加载成功");
              success_num += 1;
              //AddNotice("图片加载成功");
              //console.log("加载进度：" + success_num + "/" + img_num);
              AddNotice(
                "加载进度：" + (success_num + fail_num) + "/" + img_num
              );
              if (success_num + fail_num == img_num) {
                if (success_num == img_num) {
                  console.log("全部加载完毕");
                  ifGotImg = true;
                }
                imgLoading.value = false;
              }
            };
            img.onerror = (e) => {
              console.log("图片加载失败");
              fail_num += 1;
              AddNotice(
                "加载进度：" + (success_num + fail_num) + "/" + img_num
              );
              AddNotice("图片加载失败");
              if (success_num + fail_num == img_num) {
                console.log("全部加载结束");
                imgLoading.value = false;
              }
            };
            //img.src = require("../../assets/avatar.png"); // 要加载的图片 url
            img.src = needToLoad[s].avater_url; // 要加载的图片 url
            //TODO 改为对应用户的头像
            StuList[needToLoad[s].num].avater = img;
          }
        } else {
          console.log("还没有canvas实例，暂不加载");
          AddNotice("还没有canvas实例，暂不加载");
          imgLoading.value = false;
          ifGotImg = false;
        }
      } else {
        if (needToLoad.length == 0) {
          console.log("已加载完，无需加载");
        } else {
          console.log("正在加载头像,避免重复加载");
        }
      }
    }

    //绘制单个学生头像+姓名
    function DrawStu(ctx, stu) {
      if (ifGotImg) {
        ctx.drawImage(
          stu.avater,
          (_avatar_size + _avatar_padding) * stu.pos[0],
          (_avatar_size + _avatar_padding + _name_height) * stu.pos[1],
          _avatar_size,
          _avatar_size
        );
        ctx.fillStyle = "#2b2b2b";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(
          stu.stu_name,
          (_avatar_size + _avatar_padding) * stu.pos[0] + _avatar_size / 2,
          (_avatar_size + _avatar_padding + _name_height) * stu.pos[1] +
            _avatar_size +
            _avatar_padding / 2
        );
      } else {
        loadImg();
      }
    }
    //绘制全部学生+教室
    function DrawStuList(stuList) {
      let ctx = C_ctx;
      cleanAll(true);
      DrawClassroom();
      for (let i in stuList) {
        DrawStu(ctx, stuList[i]);
      }
    }
    //绘制全部学生[不带教室，不清空布局]
    function DrawStuListNotClean(stuList) {
      let ctx = C_ctx;
      for (let i in stuList) {
        DrawStu(ctx, stuList[i]);
      }
    }
    //绘制教室边框+黑板
    function DrawClassroom() {
      let ctx = C_ctx;
      ctx.fillStyle = "#6190e8";
      ctx.fillRect(
        (-1 * _avatar_padding) / 2,
        (-1 * _avatar_padding) / 2,
        classroom_size[0],
        classroom_size[1]
      );
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        (-1 * _avatar_padding) / 2 + _classroom_border,
        (-1 * _avatar_padding) / 2 + _classroom_border,
        classroom_size[0] - 2 * _classroom_border,
        classroom_size[1] - 2 * _classroom_border
      );
      ctx.fillStyle = "#2b2b2b";
      ctx.fillRect(
        (-1 * _avatar_padding) / 2 + _classroom_border * 2,
        (-1 * _avatar_padding) / 2 + classroom_size[1] - _blackboard_height,
        classroom_size[0] - 4 * _classroom_border,
        _blackboard_height + -2 * _classroom_border
      );
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "黑板",
        (-1 * _avatar_padding) / 2 + classroom_size[0] / 2,
        (-1 * _avatar_padding) / 2 + classroom_size[1] - _blackboard_height / 2
      );
    }
    //绘制缩放时的头像
    function DrawAvatarSize() {
      let ctx = C_ctx;
      cleanAll(true);
      if (ifGotImg) {
        ctx.drawImage(
          StuList[0].avater,
          canvas_size[0] / canvas_scal / 2 - _avatar_size / 2,
          canvas_size[1] / canvas_scal / 2 - _avatar_size / 2,
          _avatar_size,
          _avatar_size
        );
        ctx.font = "48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "调整大小:" + (canvas_scal * 100).toFixed(2) + "%",
          canvas_size[0] / canvas_scal / 2 -
            _avatar_size / 2 +
            _avatar_size / 2,
          canvas_size[1] / canvas_scal / 2 - _avatar_size / 2 - _avatar_size / 2
        );
      } else {
        loadImg();
      }
    }
    //debug小球
    function drawBall(x, y, R, color) {
      let ctx = C_ctx;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.strokeStyle = "rgba(1,1,1,0)";
      ctx.fill();
      ctx.stroke();
    }
    //计算偏移量，避免出界，传入单指当前坐标，通过单指初始落点计算移动量
    //TODO 出界计算要考虑已画内容大小
    function countLocation(X, Y) {
      let res_loc = [0, 0]; //原绘制坐标
      res_loc[0] = X - touchStartXY[0] + touchSetXY._rawValue[0];
      res_loc[1] = Y - touchStartXY[1] + touchSetXY._rawValue[1];
      if (
        res_loc[0] <
        (-1 * classroom_size[0] + _avatar_size + _avatar_padding) * canvas_scal
      ) {
        res_loc[0] =
          (-1 * classroom_size[0] + _avatar_size + _avatar_padding) *
          canvas_scal;
      } else if (res_loc[0] > canvas_size[0] - _avatar_size * canvas_scal) {
        res_loc[0] = canvas_size[0] - _avatar_size * canvas_scal;
      }
      //Y轴出界判定
      if (
        res_loc[1] <
        (-1 * classroom_size[1] +
          _avatar_size +
          _avatar_padding +
          _blackboard_height +
          _name_height) *
          canvas_scal
      ) {
        res_loc[1] =
          (-1 * classroom_size[1] +
            _avatar_size +
            _avatar_padding +
            _blackboard_height +
            _name_height) *
          canvas_scal;
      } else if (res_loc[1] > canvas_size[1] - _avatar_size * canvas_scal) {
        res_loc[1] = canvas_size[1] - _avatar_size * canvas_scal;
      }
      return res_loc;
    }
    //计算双指缩放情况
    function countDistance(touches) {
      let a = touches[0].x - touches[1].x;
      let b = touches[0].y - touches[1].y;
      change_Distance = Math.sqrt(a * a + b * b) / touch_init_Distance;
      //AddNotice("双指间距离变化量「比例」：" + change_Distance);
      canvas_scal = canvas_init_scal * change_Distance;
      //AddNotice("缩放比" + change_Distance);
    }
    //根据触碰点判断选择情况
    function selectStuByTouch(touches) {
      //drawBall(touches[0].x, touches[0].y, 5, "#1aad19");
      //AddNotice("触摸点X：" + touches[0].x + "触摸点Y：" + touches[0].y);
      let t_X = (touches[0].x - touchSetXY._rawValue[0]) / canvas_scal;
      let t_Y = (touches[0].y - touchSetXY._rawValue[1]) / canvas_scal;
      AddNotice("相对触摸点X：" + t_X + "相对触摸点Y：" + t_Y);
      let row_num = parseInt(t_X / (_avatar_size + _avatar_padding));
      let coloum_num = parseInt(
        t_Y / (_avatar_size + _avatar_padding + _name_height)
      );
      for (let s in StuList) {
        if (StuList[s].pos[0] == row_num && StuList[s].pos[1] == coloum_num) {
          selectedStu.value = StuList[s];
          AddNotice("选中了：" + StuList[s].stu_name);
          drawSelector(row_num, coloum_num);
        }
      }
      AddNotice("行：" + coloum_num + "  列：" + row_num);
    }
    //绘制选择器
    function drawSelector(row, coloum) {
      let ctx = C_ctx;
      cleanAll(true);
      ctx.save();
      ctx.translate(touchSetXY._rawValue[0], touchSetXY._rawValue[1]);
      ctx.scale(canvas_scal, canvas_scal);
      DrawClassroom();
      ctx.fillStyle = "#1aad19";
      ctx.fillRect(
        (_avatar_size + _avatar_padding) * row - _avatar_padding / 2,
        (_avatar_size + _avatar_padding + _name_height) * coloum -
          _avatar_padding / 2,
        _avatar_size + _avatar_padding,
        _avatar_size + _avatar_padding + _name_height
      );
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        (_avatar_size + _avatar_padding) * row,
        (_avatar_size + _avatar_padding + _name_height) * coloum + _avatar_size,
        _avatar_size,
        _name_height
      );
      DrawStuListNotClean(StuList);
      ctx.restore();
    }
    //开始触摸
    function TouchStart(e) {
      touchesNum += 1;
      if (touchMode == 0 && touchesNum == 1) {
        //AddNotice("单指模式");
        touchStartXY = [e.touches[0].x, e.touches[0].y];
        console.log("触摸开始", e.touches[0].x, e.touches[0].y);
        //drawBall(e.touches[0].x, e.touches[0].y, 5, "#1aad19");
      } else if (touchMode == 0 && touchesNum == 2) {
        //双指时更新初始距离
        AddNotice("双指模式");
        let a = e.touches[0].x - e.touches[1].x;
        let b = e.touches[0].y - e.touches[1].y;
        touch_init_Distance = Math.sqrt(a * a + b * b);
        AddNotice("双指间距离初始量：" + touch_init_Distance);
        canvas_init_scal = canvas_scal; //设置缩放比初始值
        touchStartXY = [
          (e.touches[0].x + e.touches[1].x) / 2,
          (e.touches[0].y + e.touches[1].y) / 2,
        ];
        //drawBall(touchStartXY[0], touchStartXY[1], 15, "#1aad19");
      }
    }
    //手指移动
    function TouchMove(e) {
      let ctx = C_ctx;
      if (touchMode == 0 && e.touches.length == 1) {
        touchMode = 1;
        AddNotice("锁定单指模式");
      } else if (touchMode == 0 && e.touches.length == 2) {
        touchMode = 2;
        AddNotice("锁定双指模式");
      }
      if (touchMode == 1) {
        let location = countLocation(e.touches[0].x, e.touches[0].y);
        //drawBall(location[0], location[1], 2, "#b47fd8");
        ctx.save();
        ctx.translate(location[0], location[1]);
        ctx.scale(canvas_scal, canvas_scal);
        DrawStuList(StuList);
        ctx.restore();
        //drawBall(e.touches[0].x, e.touches[0].y, 2, "#7fd8c9");
      } else if (touchMode == 2) {
        console.log("双指触摸", e.touches);
        if (e.touches.length == 2) {
          //双指触控
          countDistance(e.touches);
          ctx.save();
          ctx.scale(canvas_scal, canvas_scal);
          DrawAvatarSize();
          ctx.restore();
        }
      }
    }
    //结束触摸
    function TouchEnd(e) {
      touchesNum -= 1;
      //AddNotice("touchesNum:" + touchesNum);
      if (touchMode == 1) {
        if (touchesNum == 0) {
          touchSetXY.value = countLocation(
            e.changedTouches[0].x,
            e.changedTouches[0].y
          );
          console.log(
            "新起始点：",
            touchSetXY._rawValue[0],
            touchSetXY._rawValue[1]
          );
          console.log("单指触摸结束");
          AddNotice(
            "单指触摸结束X:" +
              touchSetXY._rawValue[0] +
              "Y:" +
              touchSetXY._rawValue[1]
          );
          //drawBall(e.changedTouches[0].x, e.changedTouches[0].y, 5, "#ff5252");
          touchMode = 0;
        }
      } else if (touchMode == 2) {
        AddNotice("双指触摸 changeTouches.length:" + e.changedTouches.length);
        if (touchesNum == 0) {
          console.log("双指触摸结束", e);
          let ctx = C_ctx;
          touchSetXY.value = [
            canvas_size[0] / 2 - (classroom_size[0] / 2) * canvas_scal,
            canvas_size[1] / 2 - (classroom_size[1] / 2) * canvas_scal,
          ];
          ctx.save();
          ctx.translate(touchSetXY._rawValue[0], touchSetXY._rawValue[1]);
          ctx.scale(canvas_scal, canvas_scal);
          DrawStuList(StuList);
          ctx.restore();
          touchMode = 0;

          AddNotice("双指触摸结束");
        } else if (touchesNum == 1) {
          AddNotice("仅离开了一只手指");
        }
      } else if (touchMode == 0) {
        selectStuByTouch(e.changedTouches);
      }
    }
    //更新通知
    function AddNotice(new_notice) {
      let nowTime = new Date().toString().split(" ")[4];
      //console.log(nowTime);
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
      loadImg,
      TouchStart,
      TouchMove,
      TouchEnd,
      selectedStu,
      imgLoading,
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
