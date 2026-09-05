<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="68px">
      <el-form-item label="学校" prop="schoolId"><el-select v-model="query.schoolId" clearable filterable placeholder="全部学校" @change="schoolChanged"><el-option v-for="item in schools" :key="item.schoolId" :label="item.title || item.name" :value="item.schoolId" /></el-select></el-form-item>
      <el-form-item label="院系" prop="departmentId"><el-select v-model="query.departmentId" clearable filterable placeholder="全部院系"><el-option v-for="item in departments" :key="item.departmentId" :label="item.name || item.title" :value="item.departmentId" /></el-select></el-form-item>
      <el-form-item label="专业" prop="major"><el-input v-model="query.major" clearable placeholder="专业" /></el-form-item>
      <el-form-item label="性别" prop="gender"><el-select v-model="query.gender" clearable placeholder="全部"><el-option label="男" value="男" /><el-option label="女" value="女" /><el-option label="其他/未填" value="其他" /></el-select></el-form-item>
      <el-form-item label="活动" prop="instanceId"><el-select v-model="query.instanceId" clearable filterable placeholder="全部活动"><el-option v-for="item in activities" :key="item.instanceId" :label="item.title || item.name" :value="item.instanceId" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" icon="el-icon-search" @click="load">查询</el-button><el-button icon="el-icon-refresh" @click="reset">重置</el-button><el-button type="success" icon="el-icon-download" :loading="exporting" @click="exportPdf">下载 PDF</el-button></el-form-item>
    </el-form>
    <el-row :gutter="16" class="summary-row"><el-col :span="6"><el-card shadow="never"><div class="metric-label">扫码参与人数</div><div class="metric-value">{{ enteredCount }}</div></el-card></el-col><el-col :span="6"><el-card shadow="never"><div class="metric-label">完成探索人数</div><div class="metric-value">{{ finishedCount }}</div></el-card></el-col><el-col :span="6"><el-card shadow="never"><div class="metric-label">进行中人数</div><div class="metric-value">{{ inProgressCount }}</div></el-card></el-col><el-col :span="6"><el-card shadow="never"><div class="metric-label">完成率</div><div class="metric-value">{{ completionRate }}</div></el-card></el-col></el-row>
    <el-table v-loading="loading" :data="statistics.records || []" border stripe>
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="studentName" label="学生姓名" min-width="120" align="center" />
      <el-table-column prop="studentNo" label="学号" min-width="130" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="150" align="center" />
      <el-table-column prop="departmentName" label="院系" min-width="150" align="center" />
      <el-table-column prop="major" label="专业" min-width="130" align="center" />
      <el-table-column prop="gender" label="性别" width="80" align="center" />
      <el-table-column prop="instanceName" label="活动实例" min-width="180" align="center" />
      <el-table-column label="参与状态" width="110" align="center"><template slot-scope="scope"><el-tag :type="scope.row.status === 'finished' ? 'success' : 'info'">{{ statusText(scope.row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="参与时间" min-width="170" align="center"><template slot-scope="scope">{{ formatDateTime(scope.row.scanTime) }}</template></el-table-column>
    </el-table>
    <el-empty v-if="!loading && !(statistics.records || []).length" description="暂无参与统计数据" />
  </div>
</template>

<script>
import { getStatistics, exportStatisticsPdf, zycckErrorMessage } from '@/api/zycck'
import { saveAs } from 'file-saver'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'ZycckStatistics',
  data() { return { loading: false, exporting: false, statistics: {}, schools: [], departments: [], activities: [], query: { schoolId: null, departmentId: null, major: null, gender: null, instanceId: null } } },
  computed: {
    enteredCount() { return Number(this.statistics.enteredCount != null ? this.statistics.enteredCount : (this.statistics.participating || 0)) },
    finishedCount() { return Number(this.statistics.finishedCount != null ? this.statistics.finishedCount : (this.statistics.finished || 0)) },
    inProgressCount() { return Number(this.statistics.inProgressCount != null ? this.statistics.inProgressCount : Math.max(0, this.enteredCount - this.finishedCount)) },
    completionRate() { const value = this.statistics.completionRate != null ? this.statistics.completionRate : (this.enteredCount ? Math.round(this.finishedCount * 10000 / this.enteredCount) / 100 : 0); return value + '%' }
  },
  created() { this.loadOptions(); this.load() },
  methods: {
    statusText(status) { return ({ entered: '已参与', question: '竞猜中', explore: '探索中', finished: '已完成' })[status] || '进行中' },
    formatDateTime(value) { if (!value) return '-'; const date = new Date(value); if (Number.isNaN(date.getTime())) return value; const pad = n => String(n).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` },
    loadOptions() { listSchool({ pageNum: 1, pageSize: 1000 }).then(res => { this.schools = res.rows || res.data || [] }).catch(error => this.$modal.msgError(zycckErrorMessage(error))); listInstances({}).then(res => { this.activities = res.data || res.rows || [] }).catch(error => this.$modal.msgError(zycckErrorMessage(error))) },
    schoolChanged(schoolId) { this.query.departmentId = null; this.departments = []; if (!schoolId) return; listDepartment({ schoolId, pageNum: 1, pageSize: 1000 }).then(res => { this.departments = res.rows || res.data || [] }).catch(error => this.$modal.msgError(zycckErrorMessage(error))) },
    load() { this.loading = true; getStatistics({ ...this.query, gameType: 'zycck' }).then(res => { this.statistics = res.data || res || {} }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.loading = false }) },
    reset() { this.$refs.queryForm.resetFields(); this.load() },
    exportPdf() { this.exporting = true; exportStatisticsPdf({ ...this.query, gameType: 'zycck' }).then(data => { const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' }); saveAs(blob, '未来职业猜猜看统计报告.pdf') }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.exporting = false }) }
  }
}
</script>

<style scoped>
.summary-row { margin-bottom: 18px; }
.metric-label { color: #909399; font-size: 13px; }
.metric-value { margin-top: 8px; color: #303133; font-size: 26px; font-weight: 600; }
/deep/ .el-table th, /deep/ .el-table td { text-align: center; }
/deep/ .el-tag { text-align: center; }
</style>
