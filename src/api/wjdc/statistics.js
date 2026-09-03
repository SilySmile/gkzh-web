import request from '@/utils/request'

// 查询所有问卷的答卷数量统计
export function getSurveyResponseCount() {
  return request({
    url: '/wjdc/statistics/survey/count',
    method: 'get'
  })
}

// 查询指定问卷的答卷统计
export function getSurveyResponseStatistics(surveyId) {
  return request({
    url: '/wjdc/statistics/survey/' + surveyId,
    method: 'get'
  })
}

// 查询指定问卷的所有问题统计
export function getSurveyQuestionStatistics(surveyId) {
  return request({
    url: '/wjdc/statistics/survey/' + surveyId + '/questions',
    method: 'get'
  })
}

// 查询问题选项统计
export function getQuestionOptionStatistics(questionId) {
  return request({
    url: '/wjdc/statistics/question/' + questionId + '/options',
    method: 'get'
  })
}

// 查询填空题答案统计
export function getQuestionAnswerStatistics(questionId) {
  return request({
    url: '/wjdc/statistics/question/' + questionId + '/answers',
    method: 'get'
  })
}
// 添加获取选项打分题统计详情的方法
export function getQuestionScoreOptionStatistics(questionId) {
  return request({
    url: '/wjdc/statistics/question/' + questionId + '/score-options',
    method: 'get'
  })
}