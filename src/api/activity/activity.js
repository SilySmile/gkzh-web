import request from '@/utils/request'

// 查询活动举办列表
export function listActivity(query) {
  return request({
    url: '/activity/activity/list',
    method: 'get',
    params: query
  })
}

// 查询活动举办详细
export function getActivity(activityId) {
  return request({
    url: '/activity/activity/' + activityId,
    method: 'get'
  })
}

// 新增活动举办
export function addActivity(data) {
  return request({
    url: '/activity/activity',
    method: 'post',
    data: data
  })
}

// 修改活动举办
export function updateActivity(data) {
  return request({
    url: '/activity/activity',
    method: 'put',
    data: data
  })
}

// 删除活动举办
export function delActivity(activityId) {
  return request({
    url: '/activity/activity/' + activityId,
    method: 'delete'
  })
}

export function copyActivity(activityId) {
  return request({
    url: '/activity/activity/copy/' + activityId,
    method: 'post'
  })
}
