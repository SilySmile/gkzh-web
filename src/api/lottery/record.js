import request from '@/utils/request'

// 查询抽奖记录列表
export function listRecord(query) {
  return request({
    url: '/lottery/record/list',
    method: 'get',
    params: query
  })
}

// 查询抽奖记录详细
export function getRecord(recordId) {
  return request({
    url: '/lottery/record/' + recordId,
    method: 'get'
  })
}
export function getRedemptionLogs(recordId) {
  return request({ url: '/lottery/record/' + recordId + '/redemption-logs', method: 'get' })
}
export function redeemRecord(recordId) {
  return request({ url: '/lottery/record/' + recordId + '/redeem', method: 'post' })
}

// 新增抽奖记录
export function addRecord(data) {
  return request({
    url: '/lottery/record',
    method: 'post',
    data: data
  })
}

// 修改抽奖记录
export function updateRecord(data) {
  return request({
    url: '/lottery/record',
    method: 'put',
    data: data
  })
}

// 删除抽奖记录
export function delRecord(recordId) {
  return request({
    url: '/lottery/record/' + recordId,
    method: 'delete'
  })
}
