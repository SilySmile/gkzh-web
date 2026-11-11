import request from '@/utils/request'

// 查询学生列表
export function listStudent(query) {
  return request({
    url: '/school/student/list',
    method: 'get',
    params: query
  })
}

// 查询学生详细
export function getStudent(studentId) {
  return request({
    url: '/school/student/' + studentId,
    method: 'get'
  })
}

// 新增学生
export function addStudent(data) {
  return request({
    url: '/school/student',
    method: 'post',
    data: data
  })
}

// 修改学生
export function updateStudent(data) {
  return request({
    url: '/school/student',
    method: 'put',
    data: data
  })
}

// 重置学生小程序登录密码为 123456
export function resetStudentPassword(studentId) {
  return request({
    url: '/school/student/' + studentId + '/reset-password',
    method: 'put'
  })
}

// 删除学生
export function delStudent(studentId) {
  return request({
    url: '/school/student/' + studentId,
    method: 'delete'
  })
}

// 读取小程序注册校验开关（年级/学历/毕业时间）
export function getRegisterCheck() {
  return request({
    url: '/school/student/register-check',
    method: 'get'
  })
}

// 保存小程序注册校验开关
export function saveRegisterCheck(requireProfile) {
  return request({
    url: '/school/student/register-check',
    method: 'put',
    data: { requireProfile }
  })
}
