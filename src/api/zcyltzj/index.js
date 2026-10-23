import request from '@/utils/request'

// 职场压力·骰子局 Web 管理接口。
// 配置只维护固定点数 1-6；参与记录按活动、点数和学生属性筛选，可整条删除便于测试。
export function listPoints() {
  return request({ url: '/zcyltzj/admin/points', method: 'get' })
}

export function savePoint(data) {
  return request({ url: '/zcyltzj/admin/points', method: 'post', data })
}

export function listQuestions(params) {
  return request({ url: '/zcyltzj/admin/questions', method: 'get', params })
}

export function saveQuestion(data) {
  return request({ url: '/zcyltzj/admin/questions', method: 'post', data })
}

export function deleteQuestion(questionId) {
  return request({ url: '/zcyltzj/admin/questions/' + questionId, method: 'delete' })
}

export function listRecords(params) {
  return request({ url: '/zcyltzj/admin/records', method: 'get', params })
}

export function deleteRecord(recordId) {
  return request({ url: '/zcyltzj/admin/records/' + recordId, method: 'delete' })
}

// 统计汇总与分页记录使用同一组筛选条件。
export function getStatistics(params) {
  return request({ url: '/zcyltzj/admin/statistics', method: 'get', params })
}

/** 统计导出：按当前筛选条件导出全部记录，不受列表页码影响。 */
export function exportStatisticsExcel(params) {
  return request({
    url: '/zcyltzj/admin/statistics/excel',
    method: 'get',
    params,
    responseType: 'blob',
    timeout: 300000,
  }).then(validateExcelResponse)
}

/** 二进制请求的业务错误通常也是 Blob；先确认 XLSX 文件签名。 */
async function validateExcelResponse(data) {
  const blob = data instanceof Blob ? data : new Blob([data])
  const prefix = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
  if (prefix[0] === 0x50 && prefix[1] === 0x4b && prefix[2] === 0x03 && prefix[3] === 0x04) {
    return blob
  }
  let message = 'Excel 下载失败，请稍后重试'
  try {
    const payload = JSON.parse(await blob.text())
    if (payload && payload.msg) message = payload.msg
  } catch (error) {
    /* 非 JSON 错误响应统一提示，不向用户展示技术异常。 */
  }
  const error = new Error(message)
  error.userFacing = true
  throw error
}

// 后端业务错误转成可读提示，页面不展示状态码或错误码。
const errorMessages = {
  PERMISSION_DENIED: '您没有执行此操作的权限',
  default: '操作失败，请稍后重试',
}

export function zcyltzjErrorMessage(error) {
  if (error && error.userFacing === true) return error.message
  if (typeof error === 'string' && error && !/^(error|\d{3}|[A-Z_]+)$/.test(error)) return error
  const payload = error && error.response && error.response.data
  const code = (payload && (payload.errorCode || payload.code)) || (error && error.code)
  if (code && errorMessages[code]) return errorMessages[code]
  const message = payload && payload.msg
  // 仅透传明确的中文业务提示，避免把 HTTP 状态码展示给用户。
  if (message && !/^(\d{3}|[A-Z_]+)$/.test(String(message))) return String(message)
  return errorMessages.default
}
