function drawCanvas(){
    // 取 canvas 节点
    // 此处使用 await
    let canvasNode =  new Promise((resolve, reject)=>{
      // 注意：若canvas是定义在在组件内，需改用
      // const query = wx.createSelectorQuery().in(this)
      const query = wx.createSelectorQuery()
      query.select('#classroomCanvas')
        .fields({ node: true, size: true })
        .exec(res=>{
          resolve(res[0])
        })
    })
    let canvas = canvasNode.node,
    ctx = canvas.getContext('2d')
    
    // 获取设备像素比调整画布尺寸，并缩放坐标系
    const dpr = wx.getSystemInfoSync().pixelRatio
    canvas.width = canvasNode.width * dpr
    canvas.height = canvasNode.height * dpr

    // 设置 canvas 坐标原点
    //ctx.translate(width/2, height * 2 / 3);
    ctx.scale(dpr, dpr)

    return canvas,ctx
};

export default drawCanvas()