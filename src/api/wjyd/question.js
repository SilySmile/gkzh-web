import request from '@/utils/request'

// 查询职场危机列表
export function listQuestion(query) {
  return request({
    url: '/wjyd/question/list',
    method: 'get',
    params: query
  })
}

// 查询职场危机详细
export function getQuestion(id) {
  return request({
    url: '/wjyd/question/' + id,
    method: 'get'
  })
}

// 新增职场危机
export function addQuestion(data) {
  return request({
    url: '/wjyd/question',
    method: 'post',
    data: data
  })
}

// 修改职场危机
export function updateQuestion(data) {
  return request({
    url: '/wjyd/question',
    method: 'put',
    data: data
  })
}

// 删除职场危机
export function delQuestion(id) {
  return request({
    url: '/wjyd/question/' + id,
    method: 'delete'
  })
}
