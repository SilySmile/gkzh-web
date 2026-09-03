import request from '@/utils/request'

// 查询职业方向列表
export function listCareer(query) {
  return request({
    url: '/xycc/career/list',
    method: 'get',
    params: query
  })
}

// 查询职业方向详细
export function getCareer(careerId) {
  return request({
    url: '/xycc/career/' + careerId,
    method: 'get'
  })
}

// 新增职业方向
export function addCareer(data) {
  return request({
    url: '/xycc/career',
    method: 'post',
    data: data
  })
}

// 修改职业方向
export function updateCareer(data) {
  return request({
    url: '/xycc/career',
    method: 'put',
    data: data
  })
}

// 删除职业方向
export function delCareer(careerId) {
  return request({
    url: '/xycc/career/' + careerId,
    method: 'delete'
  })
}
