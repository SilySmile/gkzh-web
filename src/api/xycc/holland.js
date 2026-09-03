import request from '@/utils/request'

export function listHollandCodes() {
  return request({
    url: '/xycc/holland/list',
    method: 'get'
  })
}

export function getHollandCode(code) {
  return request({
    url: '/xycc/holland/' + code,
    method: 'get'
  })
}

export function saveHollandCode(data) {
  return request({
    url: '/xycc/holland',
    method: 'post',
    data
  })
}

export function delHollandCode(code) {
  return request({
    url: '/xycc/holland/' + code,
    method: 'delete'
  })
}
