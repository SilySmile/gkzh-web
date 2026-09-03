import request from '@/utils/request'

// 查询抽奖奖品列表
export function listPrize(query) {
  return request({
    url: '/lottery/prize/list',
    method: 'get',
    params: query
  })
}

// 查询抽奖奖品详细
export function getPrize(prizeId) {
  return request({
    url: '/lottery/prize/' + prizeId,
    method: 'get'
  })
}

// 新增抽奖奖品
export function addPrize(data) {
  return request({
    url: '/lottery/prize',
    method: 'post',
    data: data
  })
}

// 修改抽奖奖品
export function updatePrize(data) {
  return request({
    url: '/lottery/prize',
    method: 'put',
    data: data
  })
}

// 删除抽奖奖品
export function delPrize(prizeId) {
  return request({
    url: '/lottery/prize/' + prizeId,
    method: 'delete'
  })
}
