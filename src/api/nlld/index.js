import request from '@/utils/request'

/**
 * 能量雷达 Web 管理接口。
 * 15 个维度、6 个关卡和 30 件物品固定存在；参与记录和统计按活动、结果类型、TOP 维度及学生属性筛选。
 */

/** 15 个价值观维度配置。 */
export function listDimensions() {
  return request({ url: '/nlld/admin/dimensions', method: 'get' })
}

/** 保存维度名称、分组、解读文案、排序和启停。 */
export function saveDimension(dimensionId, data) {
  return request({ url: '/nlld/admin/dimensions/' + dimensionId, method: 'post', data })
}

/** 6 个关卡及其物品配置。 */
export function listRounds() {
  return request({ url: '/nlld/admin/rounds', method: 'get' })
}

/** 保存关卡名称、情景、排序和启停。 */
export function saveRound(roundId, data) {
  return request({ url: '/nlld/admin/rounds/' + roundId, method: 'post', data })
}

/** 保存物品名称、描述、所属维度、排序和启停。 */
export function saveOption(optionId, data) {
  return request({ url: '/nlld/admin/options/' + optionId, method: 'post', data })
}

/** 参与记录分页查询。 */
export function listRecords(params) {
  return request({ url: '/nlld/admin/records', method: 'get', params })
}

/** 单条记录详情（含 6 关已选物品）。 */
export function getRecord(recordId) {
  return request({ url: '/nlld/admin/records/' + recordId, method: 'get' })
}

/** 删除整条参与记录及活动参与数据。 */
export function deleteRecord(recordId) {
  return request({ url: '/nlld/admin/records/' + recordId, method: 'delete' })
}

/** 统计汇总、维度偏好、结果类型分布、分析和分页记录。 */
export function getStatistics(params) {
  return request({ url: '/nlld/admin/statistics', method: 'get', params })
}

/** 导出统计 Excel，返回二进制 Blob。 */
export function exportStatisticsExcel(params) {
  return request({
    url: '/nlld/admin/statistics/excel',
    method: 'get',
    params,
    responseType: 'blob',
    timeout: 300000
  })
}

/** 前端展示用的中文错误提示，不展示状态码和技术异常。 */
export function nlldErrorMessage(error) {
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
