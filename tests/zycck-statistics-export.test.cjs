const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
let response, captured, requestCount = 0, statisticsRequest
const api = vm.runInNewContext(read('src/api/zycck/index.js').replace(/^import.*$/gm, '').replace(/export \{[^}]+\}/g, '').replace(/export /g, '') + '\n({exportStatisticsExcel, exportStatisticsSummaryExcel, zycckErrorMessage})', {
  Blob, Uint8Array, request: async options => { requestCount++; captured = options; return response }
})
const saved = [], warnings = [], errors = []
const script = read('src/views/zycck/statistics/index.vue').match(/<script>([\s\S]*?)<\/script>/)[1]
const page = vm.runInNewContext(script.replace(/^import.*$/gm, '').replace('export default', 'module.exports ='), {
  module: {}, ...api, saveAs: (...args) => saved.push(args),
  getStatistics: async params => { statisticsRequest = params; return { data: { total: 0, records: [] } } },
  listDepartment: async () => ({ rows: [
    { departmentId: 11, parentId: 0, title: '信息系' },
    { departmentId: 101, parentId: 11, title: '软件工程' }
  ] })
})
async function main() {
  const model = { exporting: false, summaryExporting: false, query: { pageNum: 9, pageSize: 1, schoolId: null, instanceId: null, studentNo: '2026', departmentId: 22, major: '软件', gender: '女', statusFilter: 'pendingFeedback', startDate: '2026-10-15', endDate: '2026-10-16' },
    $modal: { msgWarning: value => warnings.push(value), msgError: value => errors.push(value) } }
  model.invalidDateRange = () => page.methods.invalidDateRange.call(model)
  model.load = () => page.methods.load.call(model)
  await page.methods.exportExcel.call(model)
  assert.equal(requestCount, 0); assert.equal(warnings.length, 1)
  await page.methods.exportSummaryExcel.call(model)
  assert.equal(requestCount, 0); assert.equal(warnings.length, 2)
  model.query.schoolId = 9; model.query.instanceId = 3
  model.departments = []
  model.query.departmentId = 101
  page.methods.schoolChanged.call(model, 9)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(model.query.departmentId, null)
  assert.deepEqual(JSON.parse(JSON.stringify(model.departments.map(item => item.departmentId))), [11])
  model.query.departmentId = 22
  page.methods.search.call(model)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(statisticsRequest.startDate, '2026-10-15')
  assert.equal(statisticsRequest.endDate, '2026-10-16')
  assert.equal(statisticsRequest.statusFilter, 'pendingFeedback')
  assert.equal(model.query.pageNum, 1)
  response = new Blob(['PK\x03\x04测试XLSX'])
  await page.methods.exportExcel.call(model)
  assert.equal(captured.url, '/zycck/admin/statistics/excel')
  assert.deepEqual(JSON.parse(JSON.stringify(captured.params)), { schoolId: 9, instanceId: 3, departmentId: 22, major: '软件', gender: '女', studentNo: '2026', statusFilter: 'pendingFeedback', startDate: '2026-10-15', endDate: '2026-10-16' })
  assert.equal(saved.length, 1); assert.match(saved[0][1], /9_3\.xlsx$/)
  assert.equal(model.exporting, false)
  await page.methods.exportSummaryExcel.call(model)
  assert.equal(captured.url, '/zycck/admin/statistics/summary-excel')
  assert.deepEqual(JSON.parse(JSON.stringify(captured.params)), { schoolId: 9, instanceId: 3, statusFilter: 'pendingFeedback', startDate: '2026-10-15', endDate: '2026-10-16' })
  assert.equal(saved.length, 2); assert.match(saved[1][1], /系专业参与人数_9_3\.xlsx$/)
  assert.equal(model.summaryExporting, false)
  model.query.startDate = '2026-10-17'
  const beforeInvalid = requestCount
  const lastStatisticsRequest = statisticsRequest
  page.methods.search.call(model)
  assert.equal(statisticsRequest, lastStatisticsRequest, '日期倒序时不请求列表接口')
  await page.methods.exportExcel.call(model)
  await page.methods.exportSummaryExcel.call(model)
  assert.equal(requestCount, beforeInvalid, '日期倒序时不请求导出接口')
  assert.match(warnings.at(-1), /开始日期不能晚于结束日期/)
  model.query.startDate = '2026-10-15'
  response = new Blob([JSON.stringify({ code: 500, msg: '所选学校和活动暂无职业猜猜看参与数据' })], { type: 'application/json' })
  await page.methods.exportExcel.call(model)
  assert.equal(saved.length, 2, '错误JSON不能保存为Excel')
  assert.match(errors.at(-1), /暂无职业猜猜看参与数据/)
  await page.methods.exportSummaryExcel.call(model)
  assert.equal(saved.length, 2, '汇总接口错误不能保存为Excel')
  response = new Blob([JSON.stringify({ code: 500, msg: "请求参数类型不匹配'/zycck/admin/statistics/excel'" })], { type: 'application/json' })
  await page.methods.exportExcel.call(model)
  assert.match(errors.at(-1), /更新并重启后端/)
  response = new Blob(['服务器错误：java.lang.InternalError'])
  await page.methods.exportExcel.call(model)
  assert.equal(errors.at(-1), 'Excel下载失败，请稍后重试')
  model.exporting = true
  const before = requestCount; await page.methods.exportExcel.call(model)
  assert.equal(requestCount, before, '下载中不重复提交')
  model.summaryExporting = true
  await page.methods.exportSummaryExcel.call(model)
  assert.equal(requestCount, before, '汇总下载中不重复提交')
  console.log('统计Excel：学生明细筛选、系专业汇总范围、XLSX下载及错误响应拦截通过')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
