import request from '@/utils/request'

export function listStaff(query) { return request({ url: '/staff/account/list', method: 'get', params: query }) }
export function addStaff(data) { return request({ url: '/staff/account', method: 'post', data }) }
export function updateStaff(data) { return request({ url: '/staff/account', method: 'put', data }) }
export function resetStaffPassword(staffId, password) { return request({ url: '/staff/account/' + staffId + '/reset-password', method: 'put', data: { password } }) }
