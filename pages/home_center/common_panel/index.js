// miniprogram/pages/home_center/common_panel/index.js.js
import { getDevFunctions, getDeviceDetails, deviceControl } from '../../../utils/api/device-api'
import wxMqtt from '../../../utils/mqtt/wxMqtt'


Page({

  /**
   * 页面的初始数据
   */
  data: {
    device_name: '',
    titleItem: {
      name: '',
      value: '',
    },
    roDpList: {}, //只上报功能点
    rwDpList: {}, //可上报可下发功能点
    isRoDpListShow: false,
    isRwDpListShow: false,
    forest: '../../../image/socket.png'
  },
  data: {
    progress_txt: '正在读取中...',  
  },
  drawProgressbg: function(){
    // 使用 wx.createContext 获取绘图上下文 context
    var ctx = wx.createCanvasContext('canvasProgressbg',this)
    ctx.setLineWidth(4);// 设置圆环的宽度
    ctx.setStrokeStyle('#20183b'); // 设置圆环的颜色
    ctx.setLineCap('round') // 设置圆环端点的形状
    ctx.beginPath();//开始一个新的路径
    ctx.arc(110, 110, 100, 0, 2 * Math.PI, false);
    //设置一个原点(110,110)，半径为100的圆的路径到当前路径
    ctx.stroke();//对当前路径进行描边
    ctx.draw();
  },
 onReady: function () {
    this.drawProgressbg(); 
  },
  drawBack:function(){
    ctx.beginPath();
    ctx.arc(120, 120, 110, (5 / 6) * Math.PI, (13 / 6) * Math.PI)
    ctx.strokeStyle = '#4e6a68';
    ctx.lineWidth = 8;
    ctx.setLineDash([0]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(120, 120, 119, (5 / 6) * Math.PI, (13 / 6) * Math.PI)
    ctx.strokeStyle = '#4e6a68';
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 12]);
    ctx.stroke();
    ctx.draw();
  },
  drawRight:function(start,end){
    now = start;
    let that = this;
    canvasInterval = setInterval(function () {
      if (now > end) {
        clearInterval(canvasInterval);
      } else {
        that.draw(now);
        now += (end-start)/(time/5);
      }
    }, 5);
  },
  drawLeft: function (start, end) {
    now = start;
    let that = this;
    canvasInterval = setInterval(function () {
      if (now < end) {
        clearInterval(canvasInterval);
      } else {
        that.draw(now);
        now -= (start - end) / (time / 5);
      }
    }, 5);
  },
  draw: function (now){
    //绘制背景底盘
    ctx.beginPath();
    ctx.arc(120, 120, 110, (5 / 6) * Math.PI, (13 / 6) * Math.PI)
    ctx.strokeStyle = '#4e6a68';
    ctx.lineWidth = 8;
    ctx.setLineDash([0]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(120, 120, 119, (5 / 6) * Math.PI, (13 / 6) * Math.PI);
    ctx.strokeStyle = '#4e6a68';
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 12]);
    ctx.stroke();
    
    //绘制填充颜色部分
    ctx.beginPath();
    ctx.strokeStyle = '#18c9b2';
    ctx.arc(120, 120, 110, (5 / 6) * Math.PI, now * Math.PI);
    ctx.lineWidth = 8;
    ctx.setLineDash([0]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(120, 120, 119, (5 / 6) * Math.PI, now * Math.PI);
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 12]);
    ctx.stroke();

    ctx.draw();
  },
  drawCircle: function (step){  
    var context = wx.createCanvasContext('canvasProgress',this);
      // 设置渐变
      var gradient = context.createLinearGradient(200, 100, 100, 200);
      gradient.addColorStop("0", "#2661DD");
      gradient.addColorStop("0.5", "#40ED94");
      gradient.addColorStop("1.0", "#5956CC");
      
      context.setLineWidth(10);
      context.setStrokeStyle(gradient);
      context.setLineCap('round')
      context.beginPath(); 
      // 参数step 为绘制的圆环周长，从0到2为一周 。 -Math.PI / 2 将起始角设在12点钟位置 ，结束角 通过改变 step 的值确定
      context.arc(110, 110, 100, -Math.PI / 2, step * Math.PI - Math.PI / 2, false);
      context.stroke(); 
      context.draw() 
  },
  data: {
    progress_txt: '功率读取中...',  
    count:0, // 设置 计数器 初始为0
    countTimer: null // 设置 定时器 初始为null
  },
    countInterval: function () {
    // 设置倒计时 定时器 每100毫秒执行一次，计数器count+1 ,耗时6秒绘一圈
    this.countTimer = setInterval(() => {
      if (this.data.count <= 60) {
        /* 绘制彩色圆环进度条  
        注意此处 传参 step 取值范围是0到2，
        所以 计数器 最大值 60 对应 2 做处理，计数器count=60的时候step=2
        */
         this.drawCircle(this.data.count / (60/2))
        this.data.count++;
      } else {
        this.setData({
          progress_txt: "读取完成"
        }); 
        clearInterval(this.countTimer);
      }
    }, 100)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { device_id } = options
    this.setData({ device_id })

    // mqtt消息监听
    wxMqtt.on('message', (topic, newVal) => {
      const { status } = newVal
      console.log(newVal)
      this.updateStatus(status)
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    const { device_id } = this.data
    const [{ name, status, icon }, { functions = [] }] = await Promise.all([
      getDeviceDetails(device_id),
      getDevFunctions(device_id),
      this.drawProgressbg(),
      // this.drawBack(),
      // this.drawRight(0,100),
      this.countInterval()
    ]);

    const { roDpList, rwDpList } = this.reducerDpList(status, functions)

    // 获取头部展示功能点信息
    let titleItem = {
      name: '',
      value: '',
    };
    if (Object.keys(roDpList).length > 0) {
      let keys = Object.keys(roDpList)[0];
      titleItem = roDpList[keys];
    } else {
      let keys = Object.keys(rwDpList)[0];
      titleItem = rwDpList[keys];
    }

    const roDpListLength = Object.keys(roDpList).length
    const isRoDpListShow = Object.keys(roDpList).length > 0
    const isRwDpListShow = Object.keys(rwDpList).length > 0

    this.setData({ titleItem, roDpList, rwDpList, device_name: name, isRoDpListShow, isRwDpListShow, roDpListLength, icon })
  },

  // 分离只上报功能点，可上报可下发功能点
  reducerDpList: function (status, functions) {
    // 处理功能点和状态的数据
    let roDpList = {};
    let rwDpList = {};
    if (status && status.length) {
      status.map((item) => {
        const { code, value } = item;
        let isExit = functions.find(element => element.code == code);
        if (isExit) {
          let rightvalue = value
          // 兼容初始拿到的布尔类型的值为字符串类型
          if (isExit.type === 'Boolean') {
            rightvalue = value == 'true'
          }

          rwDpList[code] = {
            code,
            value: rightvalue,
            type: isExit.type,
            values: isExit.values,
            name: isExit.name,
          };
        } else {
          roDpList[code] = {
            code,
            value,
            name: code,
          };
        }
      });
    }
    return { roDpList, rwDpList }
  },

  sendDp: async function (e) {
    const { dpCode, value } = e.detail
    const { device_id } = this.data

    const { success } = await deviceControl(device_id, dpCode, value)
  },

  updateStatus: function (newStatus) {
    let { roDpList, rwDpList, titleItem } = this.data

    newStatus.forEach(item => {
      const { code, value } = item

      if (typeof roDpList[code] !== 'undefined') {
        roDpList[code]['value'] = value;
      } else if (rwDpList[code]) {
        rwDpList[code]['value'] = value;
      }
    })

    // 更新titleItem
    if (Object.keys(roDpList).length > 0) {
      let keys = Object.keys(roDpList)[0];
      titleItem = roDpList[keys];
    } else {
      let keys = Object.keys(rwDpList)[0];
      titleItem = rwDpList[keys];
    }
 
    this.setData({ titleItem, roDpList: { ...roDpList }, rwDpList: { ...rwDpList } })
  },

  jumpTodeviceEditPage: function(){
    console.log('jumpTodeviceEditPage')
    const { icon, device_id, device_name } = this.data
    wx.navigateTo({
      url: `/pages/home_center/device_manage/index?device_id=${device_id}&device_name=${device_name}&device_icon=${icon}`,
    })
  }
})