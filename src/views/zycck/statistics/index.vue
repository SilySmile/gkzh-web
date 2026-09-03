<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="68px">
      <el-form-item label="学校" prop="schoolId"><el-input v-model="query.schoolId" clearable placeholder="学校 ID" /></el-form-item>
      <el-form-item label="院系" prop="departmentId"><el-input v-model="query.departmentId" clearable placeholder="院系 ID" /></el-form-item>
      <el-form-item label="专业" prop="major"><el-input v-model="query.major" clearable placeholder="专业" /></el-form-item>
      <el-form-item label="性别" prop="gender"><el-select v-model="query.gender" clearable placeholder="全部"><el-option label="男" value="男" /><el-option label="女" value="女" /><el-option label="其他/未填" value="其他" /></el-select></el-form-item>
      <el-form-item label="活动实例" prop="instanceId"><el-input v-model="query.instanceId" clearable placeholder="活动实例 ID" /></el-form-item>
      <el-form-item><el-button type="primary" icon="el-icon-search" @click="load">查询</el-button><el-button icon="el-icon-refresh" @click="reset">重置</el-button><el-button type="success" icon="el-icon-download" :loading="exporting" @click="exportPdf">下载 PDF</el-button></el-form-item>
    </el-form>
    <el-row :gutter="16" class="summary-row"><el-col :span="6"><el-card shadow="never"><div class="metric-label">扫码参与人数</div><div class="metric-value">{{ enteredCount }}</div></el-card></el-col><el-col :span="6"><el-card shadow="never"><div class="metric-label">完成探索人数</div><div class="metric-value">{{ finishedCount }}</div></el-card></el-col><el-col :span="6"><el-card shadow="never"><div class="metric-label">进行中人数</div><div class="metric-value">{{ inProgressCount }}</div></el-card></el-col><el-col :span="6"><el-card shadow="never"><div class="metric-label">完成率</div><div class="metric-value">{{ completionRate }}</div></el-card></el-col></el-row>
    <el-table v-loading="loading" :data="statistics.categoryStats || []" border stripe><el-table-column prop="categoryName" label="职业大类" /><el-table-column prop="questionCount" label="竞猜题数" width="120" /><el-table-column prop="viewCount" label="浏览次数" width="120" /><el-table-column prop="explorationCount" label="加入清单数" width="130" /><el-table-column prop="averageAwareness" label="平均了解程度" width="140" /></el-table>
    <el-empty v-if="!loading && !(statistics.categoryStats || []).length" description="暂无统计数据" />
  </div>
</template>

<script>
import { getStatistics, exportStatisticsPdf, zycckErrorMessage } from '@/api/zycck'
import { saveAs } from 'file-saver'

export default {
  name: 'ZycckStatistics',
  data() { return { loading: false, exporting: false, statistics: {}, query: { schoolId: null, departmentId: null, major: null, gender: null, instanceId: null, gameId: null } } },
  computed: {
    enteredCount() { return Number(this.statistics.enteredCount != null ? this.statistics.enteredCount : (this.statistics.participating || 0)) },
    finishedCount() { return Number(this.statistics.finishedCount != null ? this.statistics.finishedCount : (this.statistics.finished || 0)) },
    inProgressCount() { return Number(this.statistics.inProgressCount != null ? this.statistics.inProgressCount : Math.max(0, this.enteredCount - this.finishedCount)) },
    completionRate() { const value = this.statistics.completionRate != null ? this.statistics.completionRate : (this.enteredCount ? Math.round(this.finishedCount * 10000 / this.enteredCount) / 100 : 0); return value + '%' }
  },
  created() { this.load() },
  methods: {
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
</style>
