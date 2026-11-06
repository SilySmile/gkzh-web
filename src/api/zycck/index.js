import request from '@/utils/request'

// zycck Web 管理接口。所有接口均以活动/游戏上下文作为查询边界，
// 具体权限由后端菜单与接口统一控制。
export function listCategories(params) {
  return request({ url: '/zycck/admin/categories', method: 'get', params })
}

export function getCategory(categoryId) {
  return request({ url: '/zycck/admin/categories/' + categoryId, method: 'get' })
}

export function saveCategory(data) {
  return request({ url: '/zycck/admin/categories', method: 'post', data })
}

export function deleteCategory(categoryId) {
  return request({ url: '/zycck/admin/categories/' + categoryId, method: 'delete' })
}

export function listCareerQuestions(params) {
  return request({ url: '/zycck/admin/career-questions', method: 'get', params })
}

export function getCareerQuestion(careerQuestionId) {
  return request({ url: '/zycck/admin/career-questions/' + careerQuestionId, method: 'get' })
}

export function saveCareerQuestion(data) {
  return request({ url: '/zycck/admin/career-questions', method: 'post', data })
}

export function deleteCareerQuestion(careerQuestionId, params) {
  return request({ url: '/zycck/admin/career-questions/' + careerQuestionId, method: 'delete', params })
}

export function listRecords(params) {
  return request({ url: '/zycck/admin/records', method: 'get', params })
}

export function deleteRecord(recordId) {
  return request({ url: '/zycck/admin/records/' + recordId, method: 'delete' })
}

export function getStatistics(params) {
  return request({ url: '/zycck/admin/statistics', method: 'get', params })
}

export function getStatisticsRecord(recordId) {
  return request({ url: '/zycck/admin/statistics/' + recordId, method: 'get' })
}

// 汉印云打印机与任务管理。
export function listPrinters() {
  return request({ url: '/zycck/admin/printers', method: 'get' })
}

// 独立的信标管理菜单维护多信标配置，保存后立即用于学生打印校验。
export function getBeaconConfig() {
  return request({ url: '/zycck/admin/beacons/config', method: 'get' })
}

export function saveBeaconConfig(data) {
  return request({ url: '/zycck/admin/beacons/config', method: 'put', data })
}

export function syncPrinters() {
  return request({ url: '/zycck/admin/printers/sync', method: 'post' })
}

export function bindPrinter(data) {
  return request({ url: '/zycck/admin/printers/bind', method: 'post', data })
}

export function renamePrinter(printerId, printerName) {
  return request({ url: '/zycck/admin/printers/' + printerId + '/name', method: 'post', params: { printerName } })
}

export function refreshPrinterStatus(printerId) {
  return request({ url: '/zycck/admin/printers/' + printerId + '/status', method: 'post' })
}

export function unbindPrinter(printerId) {
  return request({ url: '/zycck/admin/printers/' + printerId, method: 'delete' })
}

export function listPrintTasks(params) {
  return request({ url: '/zycck/admin/print-tasks', method: 'get', params })
}

// 主动向汉印云查询单个任务状态，并把结果同步到本地数据库。
export function refreshPrintTaskStatus(taskId) {
  return request({ url: '/zycck/admin/print-tasks/' + taskId + '/status', method: 'post' })
}

// 失败或已取消任务重新提交前，服务端会先核验并取消原云端任务。
export function reprintTask(taskId) {
  return request({ url: '/zycck/admin/print-tasks/' + taskId + '/reprint', method: 'post' })
}

// 取消前服务端会先查询云端；已经成功打印的任务不允许取消。
export function cancelPrintTask(taskId) {
  return request({ url: '/zycck/admin/print-tasks/' + taskId + '/cancel', method: 'post' })
}

// 删除本地打印任务测试记录；进行中的任务需要先取消。
export function deletePrintTask(taskId) {
  return request({ url: '/zycck/admin/print-tasks/' + taskId, method: 'delete' })
}

/** 学生数据 Excel：使用页面筛选条件，但不带入当前页码。 */
export function exportStatisticsExcel({ schoolId, instanceId, departmentId, major, gender, studentNo, statusFilter, startDate, endDate }) {
  return request({
    url: '/zycck/admin/statistics/excel',
    method: 'get',
    params: { schoolId, instanceId, departmentId, major, gender, studentNo, statusFilter, startDate, endDate },
    responseType: 'blob',
    timeout: 300000
  }).then(validateStatisticsExcelResponse)
}

/** 系、专业人数汇总 Excel：按学校、活动、参与日期及状态统计。 */
export function exportStatisticsSummaryExcel({ schoolId, instanceId, statusFilter, startDate, endDate }) {
  return request({
    url: '/zycck/admin/statistics/summary-excel',
    method: 'get',
    params: { schoolId, instanceId, statusFilter, startDate, endDate },
    responseType: 'blob',
    timeout: 300000
  }).then(validateStatisticsExcelResponse)
}

/** 二进制请求的业务错误通常也是 Blob；先确认 XLSX 文件签名。 */
async function validateStatisticsExcelResponse(data) {
  // axios 的二进制响应会跳过业务码校验；错误 JSON 不能被保存成损坏的 Excel。
  const blob = data instanceof Blob ? data : new Blob([data])
  const prefix = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
  if (prefix[0] === 0x50 && prefix[1] === 0x4b && prefix[2] === 0x03 && prefix[3] === 0x04) return blob
  let message = 'Excel下载失败，请稍后重试'
  try {
    const payload = JSON.parse(await blob.text())
    // 旧后端尚无 /statistics/excel 时，会把 excel 误作详情记录编号；提示更新服务端。
    if (/请求参数类型不匹配/.test(payload.msg || '') && /statistics\/excel/.test(payload.msg || '')) {
      message = '服务端尚未更新Excel导出接口，请更新并重启后端后重试'
    }
    if (/^(请先选择学校和活动|所选学校不存在|所选活动不存在|所选学校和活动暂无|当前筛选条件下暂无|开始日期不能晚于结束日期|参与状态筛选值无效)/.test(payload.msg || '')) message = payload.msg
  } catch (error) { /* 非JSON错误响应统一提示，不向用户展示技术异常。 */ }
  const error = new Error(message)
  error.userFacing = true
  throw error
}

// 后端业务错误转成人话，页面不得直接展示状态码或错误码。
const errorMessages = {
  RECORD_FINISHED: '该记录已完成，当前内容仅可查看',
  QUESTION_SUBMITTED: '本题已经提交，请继续下一题',
  CANDIDATE_COUNT_INVALID: '抽题候选数量不符合当前模式要求',
  CATEGORY_NOT_FOUND: '职业大类不存在或已停用',
  GAME_NOT_FOUND: '游戏配置不存在或已停用',
  ACTIVITY_CONTEXT_INVALID: '当前学校或活动无效，请重新进入游戏',
  PERMISSION_DENIED: '您没有执行此操作的权限',
  DUPLICATE_RECORD: '该学生在当前活动中已有记录',
  default: '操作失败，请稍后重试'
}

export function zycckErrorMessage(error) {
  if (error && error.userFacing === true) return error.message
  if (typeof error === 'string' && error && !/^(error|\d{3}|[A-Z_]+)$/.test(error)) return error
  const payload = error && error.response && error.response.data
  const code = (payload && (payload.errorCode || payload.code)) || error && error.code
  if (code && errorMessages[code]) return errorMessages[code]
  const message = payload && payload.msg
  // 仅透传明确的人话描述，避免把 HTTP/业务状态码展示给用户。
  if (message && !/^(\d{3}|[A-Z_]+)$/.test(String(message))) return String(message)
  return errorMessages.default
}

export { errorMessages }
