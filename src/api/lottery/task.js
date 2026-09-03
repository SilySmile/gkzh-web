import request from '@/utils/request'

// 查询 前置任务列表
export function listTask(query) {
  return request({
    url: '/lottery/task/list',
    method: 'get',
    params: query
  })
}

// 查询 前置任务详细
export function getTask(taskId) {
  return request({
    url: '/lottery/task/' + taskId,
    method: 'get'
  })
}

// 新增 前置任务
export function addTask(data) {
  return request({
    url: '/lottery/task',
    method: 'post',
    data: data
  })
}

// 修改 前置任务
export function updateTask(data) {
  return request({
    url: '/lottery/task',
    method: 'put',
    data: data
  })
}

// 删除 前置任务
export function delTask(taskId) {
  return request({
    url: '/lottery/task/' + taskId,
    method: 'delete'
  })
}
// 查询完成记录列表
export function listTaskLog(query) {
  return request({
    url: '/lottery/taskLog/list',
    method: 'get',
    params: query
  })
}

// 查询完成记录详细
export function getTaskLog(logId) {
  return request({
    url: '/lottery/taskLog/' + logId,
    method: 'get'
  })
}

// 新增完成记录
export function addTaskLog(data) {
  return request({
    url: '/lottery/taskLog',
    method: 'post',
    data: data
  })
}

// 修改完成记录
export function updateTaskLog(data) {
  return request({
    url: '/lottery/taskLog',
    method: 'put',
    data: data
  })
}

// 删除完成记录
export function delTaskLog(logId) {
  return request({
    url: '/lottery/taskLog/' + logId,
    method: 'delete'
  })
}
