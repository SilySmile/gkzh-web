import request from '@/utils/request'

// 查询编码组合列表
export function listCombo(query) {
  return request({
    url: '/xycc/combo/list',
    method: 'get',
    params: query
  })
}

// 查询编码组合详细
export function getCombo(patternComboId) {
  return request({
    url: '/xycc/combo/' + patternComboId,
    method: 'get'
  })
}

// 新增编码组合
export function addCombo(data) {
  return request({
    url: '/xycc/combo',
    method: 'post',
    data: data
  })
}

// 修改编码组合
export function updateCombo(data) {
  return request({
    url: '/xycc/combo',
    method: 'put',
    data: data
  })
}

// 删除编码组合
export function delCombo(patternComboId) {
  return request({
    url: '/xycc/combo/' + patternComboId,
    method: 'delete'
  })
}
