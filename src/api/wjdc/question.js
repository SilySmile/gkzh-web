import request from '@/utils/request'

// 查询问题列表
export function listQuestion(query) {
  return request({
    url: '/wjdc/question/list',
    method: 'get',
    params: query
  })
}

// 查询问题详细
export function getQuestion(id) {
  return request({
    url: '/wjdc/question/' + id,
    method: 'get'
  })
}

// 新增问题
export function addQuestion(data) {
  return request({
    url: '/wjdc/question',
    method: 'post',
    data: data
  })
}

// 修改问题
export function updateQuestion(data) {
  return request({
    url: '/wjdc/question',
    method: 'put',
    data: data
  })
}

// 删除问题
export function delQuestion(id) {
  return request({
    url: '/wjdc/question/' + id,
    method: 'delete'
  })
}

// 根据问卷ID查询问题列表
export function getQuestionsBySurveyId(surveyId) {
  return request({
    url: '/wjdc/question/survey/' + surveyId,
    method: 'get'
  })
}
