import request from '@/utils/request'

// 查询问卷管理列表
export function listSurvey(query) {
  return request({
    url: '/wjdc/survey/list',
    method: 'get',
    params: query
  })
}

// 查询问卷管理详细
export function getSurvey(id) {
  return request({
    url: '/wjdc/survey/' + id,
    method: 'get'
  })
}

// 新增问卷管理
export function addSurvey(data) {
  return request({
    url: '/wjdc/survey',
    method: 'post',
    data: data
  })
}

// 修改问卷管理
export function updateSurvey(data) {
  return request({
    url: '/wjdc/survey',
    method: 'put',
    data: data
  })
}

// 删除问卷管理
export function delSurvey(id) {
  return request({
    url: '/wjdc/survey/' + id,
    method: 'delete'
  })
}
// 复制问卷
export function copySurvey(id) {
  return request({
    url: `/wjdc/survey/copy/${id}`,
    method: 'post'
  })
}
