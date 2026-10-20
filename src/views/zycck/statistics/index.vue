<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="68px">
      <el-form-item label="学校" prop="schoolId"><el-select v-model="query.schoolId" clearable filterable placeholder="全部学校" @change="schoolChanged"><el-option v-for="item in schools" :key="item.schoolId" :label="item.title || item.name" :value="item.schoolId" /></el-select></el-form-item>
      <el-form-item label="院系" prop="departmentId"><el-select v-model="query.departmentId" clearable filterable placeholder="全部院系"><el-option v-for="item in departments" :key="item.departmentId" :label="item.name || item.title" :value="item.departmentId" /></el-select></el-form-item>
      <el-form-item label="学号" prop="studentNo"><el-input v-model.trim="query.studentNo" clearable placeholder="请输入学号" @keyup.enter.native="search" /></el-form-item>
      <el-form-item label="专业" prop="major"><el-input v-model.trim="query.major" clearable placeholder="专业" @keyup.enter.native="search" /></el-form-item>
      <el-form-item label="性别" prop="gender"><el-select v-model="query.gender" clearable placeholder="全部"><el-option label="男" value="男" /><el-option label="女" value="女" /><el-option label="其他/未填" value="其他" /></el-select></el-form-item>
      <el-form-item label="状态" prop="statusFilter"><el-select v-model="query.statusFilter" clearable placeholder="全部状态"><el-option label="进行中" value="inProgress" /><el-option label="待活动反馈" value="pendingFeedback" /><el-option label="已完成" value="finished" /></el-select></el-form-item>
      <el-form-item label="活动" prop="instanceId"><el-select v-model="query.instanceId" clearable filterable placeholder="全部活动"><el-option v-for="item in activities" :key="item.instanceId" :label="item.title || item.name" :value="item.instanceId" /></el-select></el-form-item>
      <el-form-item label="开始日期" prop="startDate"><el-date-picker v-model="query.startDate" type="date" value-format="yyyy-MM-dd" clearable placeholder="参与开始日期" style="width: 160px" /></el-form-item>
      <el-form-item label="结束日期" prop="endDate"><el-date-picker v-model="query.endDate" type="date" value-format="yyyy-MM-dd" clearable placeholder="参与结束日期" style="width: 160px" /></el-form-item>
      <el-form-item><el-button type="primary" icon="el-icon-search" @click="search">查询</el-button><el-button icon="el-icon-refresh" @click="reset">重置</el-button><el-button v-hasPermi="['zycck:statistics:export']" type="success" icon="el-icon-download" :loading="exporting" @click="exportExcel">下载学生数据 Excel</el-button><el-button v-hasPermi="['zycck:statistics:export']" type="success" plain icon="el-icon-download" :loading="summaryExporting" @click="exportSummaryExcel">下载系专业人数 Excel</el-button></el-form-item>
    </el-form>
    <div class="export-tip">参与日期按扫码时间筛选，结束日期包含当天。下载前请选择学校和活动；学生数据 Excel 使用当前所有筛选条件，系专业人数 Excel 使用学校、活动、参与日期和状态，均不受分页影响。</div>
    <el-row :gutter="16" class="summary-row"><el-col :span="6"><el-card shadow="never"><div class="metric-label">扫码参与人数</div><div class="metric-value">{{ enteredCount }}</div></el-card></el-col><el-col :span="6"><el-card shadow="never"><div class="metric-label">完成探索人数</div><div class="metric-value">{{ finishedCount }}</div></el-card></el-col><el-col :span="6"><el-card shadow="never"><div class="metric-label">进行中人数</div><div class="metric-value">{{ inProgressCount }}</div></el-card></el-col><el-col :span="6"><el-card shadow="never"><div class="metric-label">完成率</div><div class="metric-value">{{ completionRate }}</div></el-card></el-col></el-row>
    <el-table v-loading="loading" :data="statistics.records || []" border stripe>
      <el-table-column type="index" :index="rowIndex" label="#" width="60" align="center" />
      <el-table-column prop="studentName" label="学生姓名" min-width="120" align="center" />
      <el-table-column prop="studentNo" label="学号" min-width="130" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="150" align="center" />
      <el-table-column prop="departmentName" label="院系" min-width="150" align="center" />
      <el-table-column prop="major" label="专业" min-width="130" align="center" />
      <el-table-column prop="gender" label="性别" width="80" align="center" />
      <el-table-column prop="instanceName" label="活动实例" min-width="180" align="center" />
      <el-table-column label="参与状态" width="110" align="center"><template slot-scope="scope"><el-tag :type="scope.row.status === 'finished' ? 'success' : 'info'">{{ statusText(scope.row.status, scope.row.stage) }}</el-tag></template></el-table-column>
      <el-table-column label="参与时间" min-width="170" align="center"><template slot-scope="scope">{{ formatDateTime(scope.row.scanTime) }}</template></el-table-column>
      <el-table-column label="操作" width="90" fixed="right" align="center"><template slot-scope="scope"><el-button type="text" size="mini" @click="viewRecord(scope.row)">查看</el-button></template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="load" />
    <el-empty v-if="!loading && !(statistics.records || []).length" description="暂无参与统计数据" />

    <el-dialog :title="detailTitle" :visible.sync="detailVisible" width="900px" append-to-body>
      <el-descriptions v-if="detailRecord" :column="3" border size="small" class="detail-summary">
        <el-descriptions-item label="学生姓名">{{ detailRecord.studentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ detailRecord.studentNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="活动实例">{{ detailRecord.instanceName || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-tabs v-model="detailTab" v-loading="detailLoading">
        <el-tab-pane label="答题选择" name="choices">
      <el-table :data="detailChoices" border stripe style="margin-top:16px">
        <el-table-column prop="questionNo" label="题号" width="70" align="center" />
        <el-table-column prop="scenarioCareerName" label="场景职业" min-width="130" align="center" />
        <el-table-column label="学生选择" min-width="150" align="center"><template slot-scope="scope">{{ choiceText(scope.row.selectedOptionKey, scope.row.selectedCareerName) }}</template></el-table-column>
        <el-table-column label="正确答案" min-width="150" align="center"><template slot-scope="scope">{{ choiceText(scope.row.correctOptionKey, scope.row.correctCareerName) }}</template></el-table-column>
        <el-table-column label="结果" width="90" align="center"><template slot-scope="scope"><el-tag v-if="scope.row.timeout" type="info">超时</el-tag><el-tag v-else :type="scope.row.correct ? 'success' : 'danger'">{{ scope.row.correct ? '正确' : '错误' }}</el-tag></template></el-table-column>
        <el-table-column label="职业了解程度" width="130" align="center"><template slot-scope="scope">{{ awarenessText(scope.row.awareness) }}</template></el-table-column>
      </el-table>
      <el-empty v-if="!detailLoading && !detailChoices.length" description="暂无答题选择记录" />
        </el-tab-pane>
        <el-tab-pane :label="`看过的职业（${viewedCareers.length}）`" name="viewed">
          <el-table :data="viewedCareers" border stripe>
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="careerName" label="职业名称" min-width="180" />
            <el-table-column prop="oneLineIntro" label="一句话介绍" min-width="300" />
          </el-table>
          <el-empty v-if="!detailLoading && !viewedCareers.length" description="暂无职业浏览记录" />
        </el-tab-pane>
        <el-tab-pane :label="`探索清单（${explorationCareers.length}）`" name="exploration">
          <el-table :data="explorationCareers" border stripe>
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="careerName" label="职业名称" min-width="180" />
            <el-table-column prop="oneLineIntro" label="一句话介绍" min-width="300" />
          </el-table>
          <el-empty v-if="!detailLoading && !explorationCareers.length" description="探索清单为空" />
        </el-tab-pane>
        <el-tab-pane label="活动反馈" name="feedback">
          <template v-if="activityFeedback && activityFeedback.submitted">
            <div class="feedback-meta">最近提交：{{ formatDateTime(activityFeedback.submittedTime) }}</div>
            <div v-for="question in activityFeedback.questions" :key="question.questionNo" class="feedback-question">
              <div class="feedback-title">第{{ question.questionNo }}题：{{ question.title }}</div>
              <div v-for="(answer, index) in feedbackAnswerTexts(question)" :key="index" class="feedback-answer">{{ answer }}</div>
            </div>
            <el-alert v-if="!activityFeedback.showQuestion2" title="该学生未曾加入探索清单，第2题不适用。" type="info" :closable="false" />
          </template>
          <el-empty v-else-if="!detailLoading" description="暂未提交活动反馈" />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script>
import { getStatistics, getStatisticsRecord, exportStatisticsExcel, exportStatisticsSummaryExcel, zycckErrorMessage } from '@/api/zycck'
import { saveAs } from 'file-saver'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'ZycckStatistics',
  data() { return { loading: false, exporting: false, summaryExporting: false, detailLoading: false, detailVisible: false, detailRecord: null, detailChoices: [], detailTab: 'choices', detailRequestId: 0, viewedCareers: [], explorationCareers: [], activityFeedback: null, statistics: {}, schools: [], departments: [], activities: [], query: { pageNum: 1, pageSize: 10, schoolId: null, departmentId: null, studentNo: null, major: null, gender: null, statusFilter: null, instanceId: null, startDate: null, endDate: null } } },
  computed: {
    total() { return Number(this.statistics.total != null ? this.statistics.total : this.enteredCount) },
    enteredCount() { return Number(this.statistics.enteredCount != null ? this.statistics.enteredCount : (this.statistics.participating || 0)) },
    finishedCount() { return Number(this.statistics.finishedCount != null ? this.statistics.finishedCount : (this.statistics.finished || 0)) },
    inProgressCount() { return Number(this.statistics.inProgressCount != null ? this.statistics.inProgressCount : Math.max(0, this.enteredCount - this.finishedCount)) },
    completionRate() { const value = this.statistics.completionRate != null ? this.statistics.completionRate : (this.enteredCount ? Math.round(this.finishedCount * 10000 / this.enteredCount) / 100 : 0); return value + '%' },
    detailTitle() { return this.detailRecord ? `参与详情 - ${this.detailRecord.studentName || this.detailRecord.studentNo || '学生'}` : '参与详情' }
  },
  created() { this.loadOptions(); this.load() },
  methods: {
    rowIndex(index) { return (this.query.pageNum - 1) * this.query.pageSize + index + 1 },
    search() { if (this.invalidDateRange()) return; this.query.pageNum = 1; this.load() },
    invalidDateRange() { if (this.query.startDate && this.query.endDate && this.query.startDate > this.query.endDate) { this.$modal.msgWarning('开始日期不能晚于结束日期'); return true } return false },
    statusText(status, stage) { if (status !== 'finished' && stage === 'activity_feedback') return '待活动反馈'; return ({ entered: '已参与', question: '竞猜中', explore: '探索中', finished: '已完成' })[status] || '进行中' },
    choiceText(key, name) { return key ? `${key}. ${name || '-'}` : '未作答' },
    awarenessText(value) { return ({ A: '以前就知道', B: '听说过但不了解', C: '第一次知道' })[value] || (value || '-') },
    formatDateTime(value) { if (!value) return '-'; const date = new Date(value); if (Number.isNaN(date.getTime())) return value; const pad = n => String(n).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` },
    loadOptions() { listSchool({ pageNum: 1, pageSize: 1000 }).then(res => { this.schools = res.rows || res.data || [] }).catch(error => this.$modal.msgError(zycckErrorMessage(error))); listInstances({}).then(res => { this.activities = res.data || res.rows || [] }).catch(error => this.$modal.msgError(zycckErrorMessage(error))) },
    schoolChanged(schoolId) { this.query.departmentId = null; this.departments = []; if (!schoolId) return; listDepartment({ schoolId, pageNum: 1, pageSize: 1000 }).then(res => { if (this.query.schoolId === schoolId) this.departments = (res.rows || res.data || []).filter(item => Number(item.parentId || 0) === 0) }).catch(error => this.$modal.msgError(zycckErrorMessage(error))) },
    load() { if (this.invalidDateRange()) return; this.loading = true; getStatistics({ ...this.query, gameType: 'zycck' }).then(res => { this.statistics = res.data || res || {} }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.loading = false }) },
    viewRecord(row) {
      const requestId = ++this.detailRequestId
      this.detailVisible = true; this.detailLoading = true; this.detailRecord = row; this.detailTab = 'choices'
      this.detailChoices = []; this.viewedCareers = []; this.explorationCareers = []; this.activityFeedback = null
      getStatisticsRecord(row.recordId).then(res => {
        // 快速切换学生时，迟到的响应不能覆盖当前详情。
        if (requestId !== this.detailRequestId) return
        const data = res.data || res || {}
        this.detailRecord = { ...row, ...data }; this.detailChoices = data.choices || []
        this.viewedCareers = data.viewedCareers || []; this.explorationCareers = data.explorationCareers || []
        this.activityFeedback = data.activityFeedback || null
      }).catch(error => {
        if (requestId !== this.detailRequestId) return
        this.detailVisible = false; this.$modal.msgError(zycckErrorMessage(error))
      }).finally(() => { if (requestId === this.detailRequestId) this.detailLoading = false })
    },
    // 编码转中文使用接口返回的问卷定义；“其他”补充用文本插值，避免执行 HTML。
    feedbackAnswerTexts(question) {
      const answers = this.activityFeedback.answers || {}
      const prefix = `question${question.questionNo}`
      const selected = question.type === 'single' ? [answers[prefix + 'Answer']] : (answers[prefix + 'Answers'] || [])
      return selected.filter(Boolean).map(code => {
        const option = question.options.find(item => item.code === code)
        return (option ? option.label : code) + (code === 'OTHER' ? `：${answers[prefix + 'Other'] || ''}` : '')
      })
    },
    reset() { this.$refs.queryForm.resetFields(); this.departments = []; this.search() },
    async exportExcel() {
      if (this.exporting) return
      if (!this.query.schoolId || !this.query.instanceId) return this.$modal.msgWarning('请先选择学校和活动，再下载Excel')
      if (this.invalidDateRange()) return
      // 点击时固定当前筛选条件；页码和每页数量不参与导出。
      const { schoolId, instanceId, departmentId, major, gender, studentNo, statusFilter, startDate, endDate } = this.query
      this.exporting = true
      try {
        const blob = await exportStatisticsExcel({ schoolId, instanceId, departmentId, major, gender, studentNo, statusFilter, startDate, endDate })
        saveAs(blob, `职业猜猜看学生数据_${schoolId}_${instanceId}.xlsx`)
      } catch (error) { this.$modal.msgError(zycckErrorMessage(error)) }
      finally { this.exporting = false }
    },
    async exportSummaryExcel() {
      if (this.summaryExporting) return
      if (!this.query.schoolId || !this.query.instanceId) return this.$modal.msgWarning('请先选择学校和活动，再下载Excel')
      if (this.invalidDateRange()) return
      // 人数按学校、活动、参与日期和状态统计，院系等其他筛选条件及当前页不参与导出。
      const { schoolId, instanceId, statusFilter, startDate, endDate } = this.query
      this.summaryExporting = true
      try {
        const blob = await exportStatisticsSummaryExcel({ schoolId, instanceId, statusFilter, startDate, endDate })
        saveAs(blob, `职业猜猜看系专业参与人数_${schoolId}_${instanceId}.xlsx`)
      } catch (error) { this.$modal.msgError(zycckErrorMessage(error)) }
      finally { this.summaryExporting = false }
    }
  }
}
</script>

<style scoped>
.summary-row { margin-bottom: 18px; }
.export-tip { margin-bottom: 16px; color: #909399; font-size: 13px; }
.metric-label { color: #909399; font-size: 13px; }
.metric-value { margin-top: 8px; color: #303133; font-size: 26px; font-weight: 600; }
.detail-summary { margin-bottom: 6px; }
.feedback-meta { color: #909399; margin: 12px 0 18px; }
.feedback-question { padding: 18px; margin-bottom: 16px; border: 1px solid #ebeef5; border-radius: 6px; }
.feedback-title { font-weight: 600; color: #303133; line-height: 1.7; }
.feedback-answer { margin-top: 10px; color: #606266; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.7; }
/deep/ .el-table th, /deep/ .el-table td { text-align: center; }
/deep/ .el-tag { text-align: center; }
</style>
