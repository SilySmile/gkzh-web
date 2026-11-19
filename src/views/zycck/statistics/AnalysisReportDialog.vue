<template>
  <el-dialog title="导出职业猜猜看分析报告" :visible.sync="visible" width="920px" append-to-body :close-on-click-modal="false" :close-on-press-escape="!exporting" :show-close="!exporting" :before-close="beforeClose">
    <div v-loading="loading">
      <el-alert title="报告使用所选学校和活动的全部职业猜猜看数据，不受列表其他筛选条件影响。缺少的信息请在下方补齐；图片可以留空，导出后在 Word 中补充。" type="info" :closable="false" show-icon />
      <el-form v-if="form" ref="form" :model="form" label-width="130px" size="small" class="report-form" :disabled="exporting">
        <el-form-item label="学校与活动"><span>{{ scopeLabel }}</span></el-form-item>
        <el-form-item v-for="field in textFields" :key="field.key" :label="field.label" :prop="field.key" :rules="[{ required: true, whitespace: true, message: '请填写' + field.label, trigger: 'blur' }]">
          <el-input v-model="form[field.key]" :maxlength="field.max" :type="field.multiline ? 'textarea' : 'text'" :rows="field.multiline ? 4 : undefined" show-word-limit :placeholder="field.placeholder || '请填写' + field.label" />
        </el-form-item>
        <el-form-item label="目标参与总人数" required><el-input-number v-model="form.targetCount" :min="1" :max="10000000" :precision="0" controls-position="right" /><span class="hint">按本次活动覆盖群体的官方人数填写</span></el-form-item>
        <el-form-item label="院系目标人数" required>
          <div class="hint">院系名称应与系统统计名称一致。不参与的院系填 0，未掌握的人数请核实后填写。</div>
          <el-table :data="form.faculties" border size="mini" max-height="330">
            <el-table-column label="院系名称" min-width="230"><template slot-scope="scope"><el-input v-model.trim="scope.row.name" maxlength="120" placeholder="院系名称" /></template></el-table-column>
            <el-table-column label="目标人数" width="190"><template slot-scope="scope"><el-input-number v-model="scope.row.targetCount" :min="0" :max="10000000" :precision="0" controls-position="right" /></template></el-table-column>
            <el-table-column width="65"><template slot-scope="scope"><el-button type="text" :disabled="exporting" @click="form.faculties.splice(scope.$index, 1)">删除</el-button></template></el-table-column>
          </el-table>
          <el-button type="text" :disabled="exporting || form.faculties.length >= 500" @click="form.faculties.push({ name: '', targetCount: undefined })">添加院系</el-button>
          <span :class="['target-total', { mismatch: facultyTotal !== form.targetCount }]">已填合计 {{ facultyTotal }} 人 / 目标 {{ form.targetCount || '未填' }} 人</span>
        </el-form-item>
        <el-form-item label="小样本提示人数" required><el-input-number v-model="form.smallSampleThreshold" :min="1" :max="10000" :precision="0" controls-position="right" /><span class="hint">少于此人数的院系将提示谨慎解读</span></el-form-item>
        <el-form-item label="启蒙示意图（可空）"><image-upload v-model="form.illustration" :disabled="exporting" :limit="1" :file-size="5" :file-type="['png', 'jpg', 'jpeg']" /></el-form-item>
        <el-form-item label="现场照片（可空）"><image-upload v-model="sceneImageValue" :disabled="exporting" :limit="3" :file-size="5" :file-type="['png', 'jpg', 'jpeg']" /></el-form-item>
      </el-form>
      <div v-if="form" class="hint">配置信息会保存在当前浏览器，按学校和活动分别复用。</div>
    </div>
    <span slot="footer">
      <el-button :disabled="loading || exporting || !form" @click="saveDraft(true)">保存配置</el-button>
      <el-button :disabled="exporting" @click="visible = false">关闭</el-button>
      <el-button type="primary" :disabled="loading || !form" :loading="exporting" @click="download">生成并下载 Word</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getAnalysisReportConfig, exportAnalysisReport, zycckErrorMessage } from '@/api/zycck'
import { saveAs } from 'file-saver'

const textFields = [
  { key: 'reportTitle', label: '报告名称', max: 36, placeholder: '例如：总结与分析报告；为保持模板封面，请使用简短名称' },
  { key: 'studentGroup', label: '参与学生群体', max: 22, placeholder: '例如：2026级汾东校区新生' },
  { key: 'activityTheme', label: '活动主题', max: 200 },
  { key: 'activityPeriod', label: '活动时间', max: 120 },
  { key: 'deliveryUnit', label: '交付单位', max: 120 },
  { key: 'reportDate', label: '报告日期', max: 80 },
  { key: 'overview', label: '活动概况', max: 6000, multiline: true },
  { key: 'implementation', label: '实施形式与内容', max: 6000, multiline: true }
]

export default {
  name: 'AnalysisReportDialog',
  data() { return { visible: false, loading: false, exporting: false, form: null, scope: null, scopeLabel: '', requestId: 0, textFields } },
  computed: {
    facultyTotal() { return this.form ? this.form.faculties.reduce((total, row) => total + (Number.isInteger(row.targetCount) ? row.targetCount : 0), 0) : 0 },
    sceneImageValue: {
      get() { return (this.form.sceneImages || []).join(',') },
      set(value) { this.form.sceneImages = value ? value.split(',').filter(Boolean) : [] }
    }
  },
  methods: {
    draftKey() { return `zycck.analysis-report.v1.${this.scope.schoolId}.${this.scope.instanceId}` },
    async open(schoolId, instanceId) {
      if (this.exporting) return
      const requestId = ++this.requestId
      this.scope = { schoolId, instanceId }; this.scopeLabel = `学校 ${schoolId} · 活动 ${instanceId}`
      this.form = null; this.visible = true; this.loading = true
      try {
        const response = await getAnalysisReportConfig(this.scope)
        if (requestId !== this.requestId) return
        const defaults = response.data || response
        let draft = {}
        try { draft = JSON.parse(localStorage.getItem(this.draftKey()) || '{}') || {} } catch (error) { /* 草稿损坏不影响重新配置。 */ }
        // 草稿只复用配置字段，学校、活动始终取本次选择。
        const allowed = [...textFields.map(field => field.key), 'targetCount', 'smallSampleThreshold', 'faculties', 'illustration', 'sceneImages']
        const saved = {}; allowed.forEach(key => { if (Object.prototype.hasOwnProperty.call(draft, key)) saved[key] = draft[key] })
        this.form = { ...defaults, ...saved, ...this.scope }
        this.form.faculties = Array.isArray(this.form.faculties) ? this.form.faculties.filter(Boolean).map(row => ({ name: row.name || '', targetCount: row.targetCount == null ? undefined : row.targetCount })) : []
        this.form.targetCount = this.form.targetCount == null ? undefined : this.form.targetCount
        this.form.sceneImages = Array.isArray(this.form.sceneImages) ? this.form.sceneImages : []
        this.scopeLabel = `${defaults.schoolName || '学校 ' + schoolId} · ${defaults.activityName || '活动 ' + instanceId}`
      } catch (error) { if (requestId === this.requestId) { this.visible = false; this.$modal.msgError(zycckErrorMessage(error)) } }
      finally { if (requestId === this.requestId) this.loading = false }
    },
    beforeClose(done) { if (!this.exporting) done() },
    saveDraft(notify) {
      try { localStorage.setItem(this.draftKey(), JSON.stringify(this.form)); if (notify) this.$modal.msgSuccess('配置已保存在当前浏览器'); return true }
      catch (error) { if (notify) this.$modal.msgWarning('当前浏览器无法保存配置，本次仍可直接导出'); return false }
    },
    configError() {
      const coverWidth = value => Array.from(value || '').reduce((sum, ch) => sum + (ch.codePointAt(0) < 128 ? 1 : 2), 0)
      const coverFields = [['reportTitle', '报告名称', 36], ['studentGroup', '参与学生群体', 22], ['activityPeriod', '活动时间', 75], ['deliveryUnit', '交付单位', 75], ['reportDate', '报告日期', 75]]
      for (const [key, label, max] of coverFields) if (coverWidth(this.form[key]) > max) return label + '过长，会超出模板封面；请使用简短名称，完整说明可填写在活动概况中'
      if (!Number.isInteger(this.form.targetCount) || this.form.targetCount < 1 || this.form.targetCount > 10000000) return '请填写有效的目标参与总人数'
      const names = new Set()
      for (const row of this.form.faculties) {
        const name = (row.name || '').trim()
        if (!name) return '请填写各院系名称'
        if (names.has(name)) return '院系名称不能重复'
        names.add(name)
        if (!Number.isInteger(row.targetCount) || row.targetCount < 0 || row.targetCount > 10000000) return '请填写各院系的目标人数，不参与的院系可填0'
      }
      if (this.facultyTotal !== this.form.targetCount) return '各院系目标人数之和须与目标参与总人数一致'
      if (!Number.isInteger(this.form.smallSampleThreshold) || this.form.smallSampleThreshold < 1 || this.form.smallSampleThreshold > 10000) return '请填写有效的小样本提示人数'
      return null
    },
    async download() {
      if (this.loading || this.exporting || !this.form) return
      const valid = await new Promise(resolve => this.$refs.form.validate(resolve))
      if (!valid) return
      const message = this.configError()
      if (message) return this.$modal.msgWarning(message)
      this.saveDraft(false)
      const payload = JSON.parse(JSON.stringify({ ...this.form, ...this.scope }))
      this.exporting = true
      try {
        const blob = await exportAnalysisReport(payload)
        saveAs(blob, `职业猜猜看分析报告_${this.scope.schoolId}_${this.scope.instanceId}.docx`)
        this.$modal.msgSuccess('报告已生成，可在 Word 中继续编辑和补充图片')
      } catch (error) { this.$modal.msgError(zycckErrorMessage(error)) }
      finally { this.exporting = false }
    }
  }
}
</script>

<style scoped>
.report-form { margin-top: 20px; }
.hint { color: #909399; font-size: 12px; line-height: 1.8; }
span.hint { margin-left: 10px; }
.target-total { margin-left: 16px; color: #67c23a; }
.mismatch { color: #e6a23c; }
</style>
