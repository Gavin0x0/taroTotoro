## Totoro在线教室管理-前端部分项目说明

### 技术栈

- 需要用到的框架：
  - [Vue 3.0](https://v3.cn.vuejs.org/) 「目前最流行的前端框架之一」
  - [Taro-vue](https://taro-docs.jd.com/taro/docs/vue3) 「京东团队出品的开放式跨端跨框架解决方案」
- 需要用到的语言：
  - Javascript
  - HTML
  - CSS
- 开发环境：
  - Git
  - Visual Studio Code 「以下简称VS Code」
  - 微信开发者工具

### 项目源码

- 通过 Git clone 到本地，通过 VS Code 打开
- [源码地址-Github](https://github.com/levi-oh/taroTotoro)

### 项目结构说明

```md
.
├── babel.config.js         #自动生成的配置文件
├── config/                 #自动生成的配置文件
├── dist/                   #Taro编译好的项目    
├── logo及图片资料 
│   └── ...
├── package.json            #自动生成的配置文件
├── project.config.json     #自动生成的配置文件
├── project.tt.json         #自动生成的配置文件
├── readme.md               #项目说明
├── src                     #源码目录
│   ├── app.config.js       #项目入口配置「配置页面，全局属性」
│   ├── app.js              #项目入口组件
│   ├── app.scss            #全局样式
│   ├── assets              #静态资源「图片等」
│   │   ├── ask.svg
│   │   ├── avatar.png
│   │   ├── face.png
│   │   ├── stu.svg
│   │   └── tea.svg
│   ├── index.html          #主页「此文件无需修改」
│   ├── pages               #每个页面「主要在此文件夹下修改」
│   │   ├── addPage         #废弃页面
│   │   ├── homePage        #主页
│   │   ├── index           #旧主页「已废弃」
│   │   ├── qrScanPage      #旧二维码扫描页「已废弃」
│   │   ├── stuMainPage     #学生主页
│   │   ├── teaMainPage     #教师主页 
│   │   ├── testPage        #测试页「Debug用」
│   │   └── uploadPage      #学生登陆页
│   └── utils               #外部工具类
│       └── weapp-qrcode.js #二维码生成工具
├── tree.md                 #项目目录树文件
└── yarn.lock               #yarn版本控制锁
```

## 快速开始

- 开始前需要先安装配置好环境
  - Git [官网安装](https://git-scm.com/)
  - Taro [安装指南](https://taro-docs.jd.com/taro/docs/GETTING-STARTED)
  - 微信开发者工具 [下载地址](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 通过Git克隆此仓库  

```shell
git clone https://github.com/levi-oh/taroTotoro.git
```

- 进入项目文件夹

```shell
cd taroTotoro
```

- 安装依赖

```shell
yarn install
```

- 启动微信编译

```shell
yarn dev:weapp 
```

- 通过微信开发者工具打开此项目，即可预览效果及启动真机调试  
![image.png](https://tva1.sinaimg.cn/large/007e6d0Xgy1gsd1msk7x5j62e81iub1x02.jpg)

## 复杂技术点说明

### 教室绘制系统

- 关于教室绘制，由于微信小程序的包大小限制，无法使用绘图框架，遂用手写Canvas绘制的方案
- 主要代码位于 `teaMainPage/index.vue` ，由于初次接触canvas，能力有限，代码耦合程度较高，有较大的优化空间
- 关于绘制流程：
  1. 通过 `canvasUtils()` 获取Canvas，并初始化
  2. 通过 `loadImg()` 预加载头像图片数据到内存
  3. `DrawClassroom()` 计算教室大小，并绘制教室
  4. `DrawStuList(stuList)` 绘制全部学生，需传入学生list「数据来自后端」
- 关于触摸操作「缩放、移动、选中」
  - 由三个绑定在canvas上的监控函数来触发
  - `TouchMove(e)`，`TouchStart(e)`，`TouchEnd(e)`
  
```html
<canvas
type="2d"
id="classroomCanvas"
class="classroom-canvas"
disable-scroll="true"
:onTouchmove="TouchMove"
:onTouchstart="TouchStart"
:onTouchend="TouchEnd"
></canvas>
```

### 座位排布系统

- 当前系统采用的方案是依靠相邻同学扫码链接来获取相对位置信息
- 将相对位置信息发送给后端「后端处理整体的座位排布」，后端返回整个教室的布局
- <img src="https://tva1.sinaimg.cn/large/007e6d0Xgy1gsd42i5ioxj60r21imqk402.jpg" alt="屏幕快照.png" style="zoom:30%;" />
- 此方案在最理想情况下，每人只需扫码一次

### 前后端通信

- 前后端通信采取 https+webscoket 结合的方式
- 向后端发送的数据基本都采用https请求，例「省略细节」：

```js
function onSubmit(event) {
      let V_result = formValidation();
      if (!V_result) {
        console.log(formData.value);
        Taro.uploadFile({
          url: "https://eclass.idealbroker.cn/add",
          filePath: imgPath.value,
          name: "file",
          formData: {
            name: formData.value.name,
            id: formData.value.id,
          },
          success(res) {
            console.log("success", res.data);
            //Do something here
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
```

- 利用webscoket来获取后端发来的消息，例「省略细节」：

```js
//连接Websocket
function GetWebSocket() {
    ifReConnect.value = true;
    Taro.connectSocket({
    url: "wss://eclass.idealbroker.cn/ws_t/1/0",
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
        //Do something here
    });
    task.onMessage(function (msg) {
        console.log("onMessage: ", msg);
        //task.close();
        AddNotice("服务器消息：" + msg);
        try {
        let res = JSON.parse(msg.data);
        switch (res.action) {
            case "update_classroom_diagram":
            updateClassroom(res.data);
            break;
            default:
            console.log("do default:", res);
            updateClassroom(res);
            break;
        }
        } catch (error) {
        console.log("非JSON");
        }
    });
    task.onError(function () {
        //Do something here
        AddNotice("系统消息：服务器连接断开");
    });
    task.onClose(function (e) {
        //Do something here
    });
    });
}
```
