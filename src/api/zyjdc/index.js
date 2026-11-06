import request from '@/utils/request'

/**
 * 职业角斗场 Web 管理接口。
 * 角色固定 8 个；参与记录和统计按活动、角色、结果及学生属性筛选。
 */

/** 8 个动物角色配置。 */
export function listRoles() {
  return request({ url: '/zyjdc/admin/roles', method: 'get' })
}

/** 保存角色文案、头像、排序和启停。 */
export function saveRole(roleId, data) {
  return request({ url: '/zyjdc/admin/roles/' + roleId, method: 'post', data })
}

/** 参与记录分页查询。 */
export function listRecords(params) {
  return request({ url: '/zyjdc/admin/records', method: 'get', params })
}

/** 删除整条参与记录及活动参与数据。 */
export function deleteRecord(recordId) {
  return request({ url: '/zyjdc/admin/records/' + recordId, method: 'delete' })
}

/** 统计汇总、角色分布、胜负分布、分析和分页记录。 */
export function getStatistics(params) {
  return request({ url: '/zyjdc/admin/statistics', method: 'get', params })
}

/** 导出统计 Excel，返回二进制 Blob。 */
export function exportStatisticsExcel(params) {
  return request({
    url: '/zyjdc/admin/statistics/excel',
    method: 'get',
    params,
    responseType: 'blob',
    timeout: 300000
  })
}

/** 前端展示用的中文错误提示，不展示状态码和技术异常。 */
export function zyjdcErrorMessage(error) {
  const raw = error && (error.message || error.msg || (error.data && error.data.msg))
  if (!raw) return '操作失败，请稍后重试'
  const text = String(raw)
  if (/Network Error|timeout|ECONNABORTED/i.test(text)) return '网络异常，请稍后重试'
  return text
}

/** 校验导出的 Blob 是否真的是 XLSX；业务失败时把后端 JSON 转成中文提示。 */
export async function validateExcelBlob(blob) {
  if (!blob) throw new Error('导出失败，请稍后重试')
  const type = blob.type || ''
  if (type.indexOf('sheet') > -1 || type.indexOf('octet-stream') > -1) {
    return blob
  }
  let message = '导出失败，请确认已选择学校和活动后重试'
  try {
    const text = await blob.text()
    const data = JSON.parse(text)
    if (data && data.msg) message = data.msg
  } catch (e) {
    // 非 JSON 内容保留兜底提示，不向前端展示原始异常。
  }
  throw new Error(message)
}
