const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
let response, captured, pending
const api = vm.runInNewContext(read('src/api/zycck/index.js').replace(/^import.*$/gm, '').replace(/export \{[^}]+\}/g, '').replace(/export /g, '') + '\n({exportAnalysisReport,getAnalysisReportConfig,zycckErrorMessage})', { Blob, Uint8Array, request: async options => { captured = options; return pending ? pending : response } })
const saved = [], warnings = [], errors = [], drafts = new Map()
const script = read('src/views/zycck/statistics/AnalysisReportDialog.vue').match(/<script>([\s\S]*?)<\/script>/)[1]
const component = vm.runInNewContext(script.replace(/^import.*$/gm, '').replace('export default', 'module.exports ='), {
  module: {}, ...api, saveAs: (...args) => saved.push(args),
  localStorage: { getItem: key => drafts.get(key), setItem: (key,value) => drafts.set(key,value) }
})
const instance = () => {
  const model = { ...component.data(), $refs: { form: { validate: callback => callback(true) } }, $modal: { msgWarning: value => warnings.push(value), msgError: value => errors.push(value), msgSuccess: () => {} } }
  Object.entries(component.methods).forEach(([name,method]) => { model[name] = method.bind(model) })
  Object.defineProperty(model,'facultyTotal',{ get: () => component.computed.facultyTotal.call(model) })
  return model
}
const config = { schoolId: 9, instanceId: 3, schoolName: '测试学校', activityName: '测试活动', faculties: [{ name: '信息系', targetCount: null }], targetCount: null, smallSampleThreshold: 30 }
async function main() {
  const model = instance()
  response = { data: config }
  drafts.set('zycck.analysis-report.v1.9.3', JSON.stringify({ schoolId: 99, instanceId: 99, deliveryUnit: '生涯中心' }))
  await model.open(9,3)
  assert.deepEqual(JSON.parse(JSON.stringify(captured.params)), { schoolId: 9, instanceId: 3 })
  assert.equal(model.form.schoolId, 9); assert.equal(model.form.instanceId, 3)
  assert.equal(model.form.deliveryUnit, '生涯中心'); assert.equal(model.form.faculties[0].targetCount, undefined, '未知目标不能自动成为0')
  assert.match(model.configError(), /目标参与总人数/)
  model.form.targetCount = 100; assert.match(model.configError(), /各院系的目标/)
  model.form.faculties[0].targetCount = 99; assert.match(model.configError(), /之和/)
  model.form.faculties[0].targetCount = 100
  model.form.faculties.push({ name: '信息系', targetCount: 0 }); assert.match(model.configError(), /重复/)
  model.form.faculties[1].name = '零参与系'; assert.equal(model.configError(), null)
  response = new Blob([JSON.stringify({ code: 500, msg: '各院系目标人数之和须与目标参与总人数一致' })])
  await model.download(); assert.equal(saved.length, 0); assert.match(errors.at(-1), /之和/); assert.equal(model.exporting,false)
  let resolve; pending = new Promise(done => { resolve = done })
  const downloading = model.download(); await new Promise(done => setImmediate(done))
  assert.equal(model.exporting,true); const previous = captured
  await model.download(); assert.equal(captured,previous,'导出期间不重复请求')
  resolve(new Blob(['PK\x03\x04word'])); await downloading; pending = null
  assert.equal(saved.length,1); assert.match(saved[0][1], /9_3\.docx$/)
  assert.equal(captured.method,'post'); assert.equal(captured.data.schoolId,9); assert.equal(captured.data.instanceId,3)
  assert.equal(captured.data.departmentId,undefined); assert.equal(captured.data.pageNum,undefined)
  assert.equal(model.exporting,false); assert.ok(drafts.has('zycck.analysis-report.v1.9.3'))
  response = new Blob(['java.lang.InternalError'])
  await assert.rejects(api.exportAnalysisReport(config), /报告生成失败/)
  // 快速切换学校，迟到响应不得覆盖新配置。
  let oldResolve; pending = new Promise(done => { oldResolve = done })
  const oldOpen = model.open(1,2); pending = null; response = { data: { ...config,schoolId:4,instanceId:5 } }
  await model.open(4,5); oldResolve({ data:config }); await oldOpen
  assert.equal(model.form.schoolId,4); assert.equal(model.form.instanceId,5)
  console.log('Word报告：学校活动范围、未知目标、配置复用、错误拦截、重复导出与迟到响应检查通过')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
