import request from '@/utils/request'

// 查询用户记录列表
export function listSelection(query) {
  return request({
    url: '/xycc/selection/list',
    method: 'get',
    params: query
  })
}

// 用户记录列表：包含学生、学校、院系、专业、选择图案和霍兰德类型
export function listSelectionRecords(query) {
  return request({
    url: '/xycc/selection/records',
    method: 'get',
    params: query
  })
}

// 查询用户记录详细
export function getSelection(userSelectionId) {
  return request({
    url: '/xycc/selection/' + userSelectionId,
    method: 'get'
  })
}

// 新增用户记录
export function addSelection(data) {
  return request({
    url: '/xycc/selection',
    method: 'post',
    data: data
  })
}

// 修改用户记录
export function updateSelection(data) {
  return request({
    url: '/xycc/selection',
    method: 'put',
    data: data
  })
}

// 删除用户记录
export function delSelection(userSelectionId) {
  return request({
    url: '/xycc/selection/' + userSelectionId,
    method: 'delete'
  })
}
