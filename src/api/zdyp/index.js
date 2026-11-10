import request from '@/utils/request'

// 职得一拼 Web 管理接口：10 套岗位、40 张维度卡片、规则参数、参与记录、统计与 Excel 导出。

export function getConfig() {
  return request({ url: '/zdyp/admin/config', method: 'get' })
}

export function saveCareer(careerId, data) {
  return request({ url: '/zdyp/admin/careers/' + careerId, method: 'put', data })
}

export function saveCard(cardId, data) {
  return request({ url: '/zdyp/admin/cards/' + cardId, method: 'put', data })
}

export function saveSetting(data) {
  return request({ url: '/zdyp/admin/setting', method: 'put', data })
}

export function listRecords(params) {
  return request({ url: '/zdyp/admin/records', method: 'get', params })
}

export function getRecord(recordId) {
  return request({ url: '/zdyp/admin/records/' + recordId, method: 'get' })
}

export function deleteRecord(recordId) {
  return request({ url: '/zdyp/admin/records/' + recordId, method: 'delete' })
}

export function getStatistics(params) {
  return request({ url: '/zdyp/admin/statistics', method: 'get', params })
}

/** 统计导出：按当前筛选条件导出全部记录，不受列表页码影响。 */
export function exportStatisticsExcel(params) {
  return request({
    url: '/zdyp/admin/statistics/excel',
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

const errorMessages = {
  PERMISSION_DENIED: '您没有执行此操作的权限',
  default: '操作失败，请稍后重试',
}

export function zdypErrorMessage(error) {
  if (error && error.userFacing === true) return error.message
  if (typeof error === 'string' && error && !/^(error|\d{3}|[A-Z_]+)$/.test(error)) return error
  const payload = error && error.response && error.response.data
  const code = (payload && (payload.errorCode || payload.code)) || (error && error.code)
  if (code && errorMessages[code]) return errorMessages[code]
  const message = payload && payload.msg
  if (message && !/^(\d{3}|[A-Z_]+)$/.test(String(message))) return String(message)
  return errorMessages.default
}
