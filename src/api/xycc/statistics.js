import request from '@/utils/request'

/**
 * 心愿橱窗 Web 统计接口。
 * 统计、明细和导出共用同一筛选条件。
 */

/** 统计汇总、编码分布、分析和当前筛选下的分页明细。 */
export function getStatistics(params) {
  return request({ url: '/xycc/admin/statistics', method: 'get', params })
}

/** 导出统计 Excel，返回二进制 Blob。 */
export function exportStatisticsExcel(params) {
  return request({
    url: '/xycc/admin/statistics/excel',
    method: 'get',
    params,
    responseType: 'blob',
    timeout: 300000
  })
}

/** 前端展示用的中文错误提示，不展示状态码和技术异常。 */
export function xyccErrorMessage(error) {
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
    // 非 JSON 内容保留兜底提示
  }
  throw new Error(message)
}
