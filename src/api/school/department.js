import request from '@/utils/request'

// 获取部门树
export function getDepartmentTree(schoolId) {
  return request({
    url: `/school/department/tree/${schoolId}`,
    method: 'get'
  })
}

// 获取部门列表
export function getDepartmentList(query) {
  return request({
    url: '/school/department/list',
    method: 'get',
    params: query
  })
}

export function listDepartment(query) {
  return getDepartmentList(query).then(res => {
    const data = res && res.data
    return {
      ...res,
      rows: Array.isArray(data) ? data : []
    }
  })
}

// 获取部门详细信息
export function getDepartment(departmentId) {
  return request({
    url: `/school/department/${departmentId}`,
    method: 'get'
  })
}

// 新增
export function addDepartment(data) {
  return request({
    url: '/school/department',
    method: 'post',
    data: data
  })
}

// 修改
export function updateDepartment(data) {
  return request({
    url: '/school/department',
    method: 'put',
    data: data
  })
}

// 删除
export function delDepartment(departmentId) {
  return request({
    url: `/school/department/${departmentId}`,
    method: 'delete'
  })
}

// 获取部门下拉树列表
export function getDepartmentTreeSelect(schoolId) {
  return request({
    url: `/school/department/treeselect/${schoolId}`,
    method: 'get'
  })
} 
