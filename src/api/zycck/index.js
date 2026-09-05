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

/**
 * PDF 接口固定返回 application/pdf 文件流，调用方使用 downloadGet 下载。
 */
export function exportStatisticsPdf(params) {
  return request({
    url: '/zycck/admin/statistics/pdf',
    method: 'get',
    params,
    responseType: 'blob'
  })
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
