import request from '@/utils/request'

// 查询签到签退列表
export function listCheckin(query) {
  return request({
    url: '/qdqt/checkin/list',
    method: 'get',
    params: query
  })
}

// 查询签到签退详细
export function getCheckin(checkinId) {
  return request({
    url: '/qdqt/checkin/' + checkinId,
    method: 'get'
  })
}

// 新增签到签退
export function addCheckin(data) {
  return request({
    url: '/qdqt/checkin',
    method: 'post',
    data: data
  })
}

// 修改签到签退
export function updateCheckin(data) {
  return request({
    url: '/qdqt/checkin',
    method: 'put',
    data: data
  })
}

// 删除签到签退
export function delCheckin(checkinId) {
  return request({
    url: '/qdqt/checkin/' + checkinId,
    method: 'delete'
  })
}
