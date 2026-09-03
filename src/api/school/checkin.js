import request from '@/utils/request'

// 查询学生签到记录列表
export function listCheckin(query) {
  return request({
    url: '/school/checkin/list',
    method: 'get',
    params: query
  })
}

// 查询学生签到记录详细
export function getCheckin(checkinId) {
  return request({
    url: '/school/checkin/' + checkinId,
    method: 'get'
  })
}

// 新增学生签到记录
export function addCheckin(data) {
  return request({
    url: '/school/checkin',
    method: 'post',
    data: data
  })
}

// 修改学生签到记录
export function updateCheckin(data) {
  return request({
    url: '/school/checkin',
    method: 'put',
    data: data
  })
}

// 删除学生签到记录
export function delCheckin(checkinId) {
  return request({
    url: '/school/checkin/' + checkinId,
    method: 'delete'
  })
}

// 学生签到
export function studentCheckin(data) {
  return request({
    url: '/school/checkin/student',
    method: 'post',
    data: data
  })
} 