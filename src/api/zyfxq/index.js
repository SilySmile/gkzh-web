import request from '@/utils/request'

// 职业飞行棋 Web 管理接口。
// 所需配置维护 19 格棋盘、规则参数和两类题库；参与记录与统计按活动、结果和学生属性筛选。

/** 所需配置：19 个格子、规则参数和全部题目。 */
export function getConfig() {
  return request({ url: '/zyfxq/admin/config', method: 'get' })
}

/** 保存单个格子：类型、题目类型、文案、底色与启停。 */
export function saveCell(cellNo, data) {
  return request({ url: '/zyfxq/admin/cells/' + cellNo, method: 'post', data })
}

/** 保存规则参数：单局时长、单题限时、后退格数、骰子面数与启停。 */
export function saveSetting(data) {
  return request({ url: '/zyfxq/admin/setting', method: 'post', data })
}

/** 题库列表；questionType 为空表示全部。 */
export function listQuestions(params) {
  return request({ url: '/zyfxq/admin/questions', method: 'get', params })
}

/** 新增或修改题目及其 4 个选项。 */
export function saveQuestion(data) {
  return request({ url: '/zyfxq/admin/questions', method: 'post', data })
}

/** 删除题目及其选项。 */
export function deleteQuestion(questionId) {
  return request({ url: '/zyfxq/admin/questions/' + questionId, method: 'delete' })
}

export function listRecords(params) {
  return request({ url: '/zyfxq/admin/records', method: 'get', params })
}

export function getRecord(recordId) {
  return request({ url: '/zyfxq/admin/records/' + recordId, method: 'get' })
}

export function deleteRecord(recordId) {
  return request({ url: '/zyfxq/admin/records/' + recordId, method: 'delete' })
}

// 统计汇总、知识点、题目统计与学生明细共用同一组筛选条件。
export function getStatistics(params) {
  return request({ url: '/zyfxq/admin/statistics', method: 'get', params })
}

/** 统计导出：按当前筛选条件导出全部记录，不受列表页码影响。 */
export function exportStatisticsExcel(params) {
  return request({
    url: '/zyfxq/admin/statistics/excel',
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

export function zyfxqErrorMessage(error) {
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
