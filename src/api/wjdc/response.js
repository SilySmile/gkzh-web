import request from '@/utils/request'

// 查询用户答卷列表
export function listResponse(query) {
  return request({
    url: '/wjdc/response/list',
    method: 'get',
    params: query
  })
}

// 查询用户答卷详细
export function getResponse(responseId) {
  return request({
    url: '/wjdc/response/' + responseId,
    method: 'get'
  })
}

// 查询用户答卷详情（包含答案）
export function getResponseDetail(responseId) {
  return request({
    url: '/wjdc/response/detail/' + responseId,
    method: 'get'
  })
}

// 新增用户答卷
export function addResponse(data) {
  return request({
    url: '/wjdc/response',
    method: 'post',
    data: data
  })
}

// 修改用户答卷
export function updateResponse(data) {
  return request({
    url: '/wjdc/response',
    method: 'put',
    data: data
  })
}

// 删除用户答卷
export function delResponse(responseId) {
  return request({
    url: '/wjdc/response/' + responseId,
    method: 'delete'
  })
} 