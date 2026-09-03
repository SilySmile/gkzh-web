import request from '@/utils/request'

// 查询工作环境偏好列表
export function listEnv(query) {
  return request({
    url: '/xycc/env/list',
    method: 'get',
    params: query
  })
}

// 查询工作环境偏好详细
export function getEnv(workEnvId) {
  return request({
    url: '/xycc/env/' + workEnvId,
    method: 'get'
  })
}

// 新增工作环境偏好
export function addEnv(data) {
  return request({
    url: '/xycc/env',
    method: 'post',
    data: data
  })
}

// 修改工作环境偏好
export function updateEnv(data) {
  return request({
    url: '/xycc/env',
    method: 'put',
    data: data
  })
}

// 删除工作环境偏好
export function delEnv(workEnvId) {
  return request({
    url: '/xycc/env/' + workEnvId,
    method: 'delete'
  })
}
