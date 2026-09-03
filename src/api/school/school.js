import request from '@/utils/request'

// 查询学校列表
export function listSchool(query) {
  return request({
    url: '/school/school/list',
    method: 'get',
    params: query
  })
}

// 查询学校详细
export function getSchool(schoolId) {
  return request({
    url: '/school/school/' + schoolId,
    method: 'get'
  })
}

// 新增学校
export function addSchool(data) {
  return request({
    url: '/school/school',
    method: 'post',
    data: data
  })
}

// 修改学校
export function updateSchool(data) {
  return request({
    url: '/school/school',
    method: 'put',
    data: data
  })
}

// 删除学校
export function delSchool(schoolId) {
  return request({
    url: '/school/school/' + schoolId,
    method: 'delete'
  })
}
