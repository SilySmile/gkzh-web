import request from '@/utils/request'

// 查询选项列表
export function listOption(query) {
  return request({
    url: '/wjdc/option/list',
    method: 'get',
    params: query
  })
}

// 查询选项详细
export function getOption(id) {
  return request({
    url: '/wjdc/option/' + id,
    method: 'get'
  })
}

// 新增选项
export function addOption(data) {
  return request({
    url: '/wjdc/option',
    method: 'post',
    data: data
  })
}

// 修改选项
export function updateOption(data) {
  return request({
    url: '/wjdc/option',
    method: 'put',
    data: data
  })
}

// 删除选项
export function delOption(id) {
  return request({
    url: '/wjdc/option/' + id,
    method: 'delete'
  })
}

// 根据问题ID查询选项列表
export function getOptionsByQuestionId(questionId) {
  return request({
    url: '/wjdc/option/question/' + questionId,
    method: 'get'
  })
} 