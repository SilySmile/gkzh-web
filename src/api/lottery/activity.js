import request from '@/utils/request'

// 查询抽奖活动列表
export function listActivity(query) {
  return request({
    url: '/lottery/activity/list',
    method: 'get',
    params: query
  })
}

// 查询抽奖活动详细
export function getActivity(activityId) {
  return request({
    url: '/lottery/activity/' + activityId,
    method: 'get'
  })
}

// 新增抽奖活动
export function addActivity(data) {
  return request({
    url: '/lottery/activity',
    method: 'post',
    data: data
  })
}

// 修改抽奖活动
export function updateActivity(data) {
  return request({
    url: '/lottery/activity',
    method: 'put',
    data: data
  })
}

export function changeActivityStatus(lotteryId, status) {
  return request({
    url: '/lottery/activity/changeStatus',
    method: 'put',
    data: { lotteryId, status }
  })
}

// 删除抽奖活动
export function delActivity(activityId) {
  return request({
    url: '/lottery/activity/' + activityId,
    method: 'delete'
  })
}

// 导出抽奖活动
export function exportActivity(query) {
  return request({
    url: '/lottery/activity/export',
    method: 'post',
    data: query
  })
} 
