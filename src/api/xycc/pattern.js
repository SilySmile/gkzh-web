import request from '@/utils/request'

// 查询心愿橱窗列表
export function listPattern(query) {
  return request({
    url: '/xycc/pattern/list',
    method: 'get',
    params: query
  })
}

// 查询心愿橱窗详细
export function getPattern(patternId) {
  return request({
    url: '/xycc/pattern/' + patternId,
    method: 'get'
  })
}

// 新增心愿橱窗
export function addPattern(data) {
  return request({
    url: '/xycc/pattern',
    method: 'post',
    data: data
  })
}

// 修改心愿橱窗
export function updatePattern(data) {
  return request({
    url: '/xycc/pattern',
    method: 'put',
    data: data
  })
}

// 删除心愿橱窗
export function delPattern(patternId) {
  return request({
    url: '/xycc/pattern/' + patternId,
    method: 'delete'
  })
}
