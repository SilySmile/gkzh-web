// 谁是职场TOP后台接口：配置查询、保存以及房间日志查询。
import request from '@/utils/request'

export const listDimensions = params => request({ url: '/sszctop/config/dimensions', method: 'get', params })
export const saveDimension = (data, isNew) => request({ url: '/sszctop/config/dimensions', method: isNew ? 'post' : 'put', data })
// 删除指定维度；后端会校验关联排序数据和当前用户权限。
export const deleteDimension = id => request({ url: `/sszctop/config/dimensions/${id}`, method: 'delete' })
export const listCareers = params => request({ url: '/sszctop/config/careers', method: 'get', params })
export const saveCareer = (data, isNew) => request({ url: '/sszctop/config/careers', method: isNew ? 'post' : 'put', data })
// 删除指定职业；后端会校验关联排序数据和当前用户权限。
export const deleteCareer = id => request({ url: `/sszctop/config/careers/${id}`, method: 'delete' })
export const listRanks = params => request({ url: '/sszctop/config/ranks', method: 'get', params })
export const saveRank = (data, isNew) => request({ url: '/sszctop/config/ranks', method: isNew ? 'post' : 'put', data })
// 删除指定维度排序文案，不会影响其他维度或职业配置。
export const deleteRank = id => request({ url: `/sszctop/config/ranks/${id}`, method: 'delete' })
export const listRoomLogs = params => request({ url: '/sszctop/config/room-logs', method: 'get', params })
// 查询一个房间内的完整事件明细，列表页仅展示房间汇总信息。
export const getRoomLogDetails = roomId => request({ url: `/sszctop/config/room-logs/${roomId}`, method: 'get' })
// 通过日志中的用户和游戏定位，清除该用户本游戏的测试报告及参与记录。
export const clearTestRecord = logId => request({ url: `/sszctop/config/room-logs/${logId}/test-record`, method: 'delete' })
// 批量清理时服务端按游戏和用户集合执行 IN 条件删除，避免逐条请求。
export const clearTestRecords = logIds => request({ url: '/sszctop/config/room-logs/test-records', method: 'delete', data: { logIds } })

// 统计汇总、七维度完成情况、结果分布和当前筛选下的分页明细。
export const getStatistics = params => request({ url: '/sszctop/admin/statistics', method: 'get', params })
// 导出统计 Excel，返回二进制 Blob；超时时间放宽以适应全校数据。
export const exportStatisticsExcel = params => request({
  url: '/sszctop/admin/statistics/excel',
  method: 'get',
  params,
  responseType: 'blob',
  timeout: 300000
})

// 前端展示用的中文错误提示，不展示状态码和技术异常。
export function sszctopErrorMessage(error) {
  const raw = error && (error.message || error.msg || (error.data && error.data.msg))
  if (!raw) return '操作失败，请稍后重试'
  const text = String(raw)
  if (/Network Error|timeout|ECONNABORTED/i.test(text)) return '网络异常，请稍后重试'
  return text
}

// 校验导出的 Blob 是否真的是 XLSX；业务失败时把后端 JSON 转成中文提示。
export async function validateExcelBlob(blob) {
  if (!blob) throw new Error('导出失败，请稍后重试')
  const type = blob.type || ''
  if (type.indexOf('sheet') > -1 || type.indexOf('octet-stream') > -1) {
    return blob
  }
  let message = '导出失败，请确认已选择学校和活动后重试'
  try {
    const text = await blob.text()
    const data = JSON.parse(text)
    if (data && data.msg) message = data.msg
  } catch (e) {
    // 非 JSON 内容保留兜底提示
  }
  throw new Error(message)
}
