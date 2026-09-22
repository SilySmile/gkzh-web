<template>
  <div class="app-container">
    <el-form :inline="true" size="small" class="query-form" @submit.native.prevent>
      <el-form-item label="状态"><el-select v-model="query.status" clearable placeholder="全部状态" @change="search"><el-option label="待提交" value="pending" /><el-option label="已提交" value="submitted" /><el-option label="打印中" value="printing" /><el-option label="成功" value="success" /><el-option label="失败" value="failed" /></el-select></el-form-item>
      <el-form-item label="打印机"><el-select v-model="query.printerId" clearable filterable placeholder="全部打印机" @change="search"><el-option v-for="item in printers" :key="item.printerId" :label="item.printerName || item.equipmentSn" :value="item.printerId" /></el-select></el-form-item>
      <el-form-item label="报告记录"><el-input v-model.trim="query.recordId" clearable placeholder="请输入记录 ID" @keyup.enter.native="search" /></el-form-item>
      <el-form-item><el-button type="primary" icon="el-icon-search" @click="search">查询</el-button><el-button icon="el-icon-refresh" @click="reset">重置</el-button></el-form-item>
    </el-form>
    <div class="toolbar"><el-button icon="el-icon-refresh-right" :loading="loading" @click="load">刷新任务</el-button><span class="toolbar-note">报告内容按 76mm × 130mm 标签发送，打印类型：TSPL</span></div>
    <el-table v-loading="loading" :data="tasks" border stripe>
      <el-table-column prop="taskId" label="任务 ID" width="90" align="center" />
      <el-table-column prop="recordId" label="报告记录" width="100" align="center" />
      <el-table-column label="打印机" min-width="170"><template slot-scope="scope">{{ printerName(scope.row) }}</template></el-table-column>
      <el-table-column prop="printId" label="云端任务 ID" min-width="160" />
      <el-table-column label="状态" width="110" align="center"><template slot-scope="scope"><el-tag :type="taskType(scope.row.status)">{{ taskText(scope.row.status) }}</el-tag></template></el-table-column>
      <el-table-column prop="retryCount" label="重试次数" width="90" align="center" />
      <el-table-column label="失败原因" min-width="180"><template slot-scope="scope">{{ scope.row.errorMessage || '-' }}</template></el-table-column>
      <el-table-column label="创建时间" width="170" align="center"><template slot-scope="scope">{{ formatDate(scope.row.createTime) }}</template></el-table-column>
      <el-table-column label="操作" width="230" fixed="right" align="center"><template slot-scope="scope"><el-button v-hasPermi="['zycck:print-task:query']" type="text" size="small" :loading="statusLoading === scope.row.taskId" @click="refreshStatus(scope.row)">刷新状态</el-button><el-button v-hasPermi="['zycck:print-task:reprint']" type="text" size="small" :disabled="scope.row.status === 'printing'" @click="reprint(scope.row)">重新打印</el-button></template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="load" />
    <el-empty v-if="!loading && !tasks.length" description="暂无打印任务" />
  </div>
</template>

<script>
import { listPrinters, listPrintTasks, refreshPrintTaskStatus, reprintTask } from '@/api/zycck'
import { zycckErrorMessage } from '@/api/zycck'

export default {
  name: 'ZycckPrintTasks',
  data() { return { tasks: [], printers: [], total: 0, loading: false, statusLoading: null, query: { pageNum: 1, pageSize: 10, status: '', printerId: '', recordId: '' } } },
  created() { this.loadPrinters(); this.load() },
  methods: {
    unwrap(res) { return (res && res.data) || res || [] },
    loadPrinters() { listPrinters().then(res => { this.printers = this.unwrap(res) }).catch(e => this.$modal.msgError(zycckErrorMessage(e))) },
    load() { this.loading = true; listPrintTasks({ ...this.query, status: this.query.status || undefined, printerId: this.query.printerId || undefined, recordId: this.query.recordId || undefined }).then(res => { this.tasks = res.rows || []; this.total = Number(res.total) || 0 }).catch(e => this.$modal.msgError(zycckErrorMessage(e))).finally(() => { this.loading = false }) },
    search() { this.query.pageNum = 1; this.load() },
    reset() { this.query = { pageNum: 1, pageSize: 10, status: '', printerId: '', recordId: '' }; this.load() },
    refreshStatus(row) { this.statusLoading = row.taskId; refreshPrintTaskStatus(row.taskId).then(res => { const item = this.unwrap(res); const index = this.tasks.findIndex(task => task.taskId === item.taskId); if (index >= 0) this.$set(this.tasks, index, item); else this.load(); }).catch(e => this.$modal.msgError(zycckErrorMessage(e))).finally(() => { this.statusLoading = null }) },
    reprint(row) { this.$modal.confirm('确认重新打印该报告？').then(() => reprintTask(row.taskId)).then(() => { this.$modal.msgSuccess('重打印任务已提交'); this.query.pageNum = 1; this.load() }).catch(e => { if (e) this.$modal.msgError(zycckErrorMessage(e)) }) },
    printerName(row) { const item = this.printers.find(printer => printer.printerId === row.printerId); return item ? (item.printerName || item.equipmentSn) : (row.equipmentSn || '-') },
    taskText(status) { return ({ pending: '待提交', submitted: '已提交', printing: '打印中', success: '成功', failed: '失败' })[status] || status || '未知' },
    taskType(status) { return status === 'success' ? 'success' : status === 'failed' ? 'danger' : status === 'printing' ? 'warning' : 'info' },
    formatDate(value) { return value ? this.parseTime(value, '{y}-{m}-{d} {h}:{i}:{s}') : '-' }
  }
}
</script>

<style scoped>
.query-form { margin-bottom: 4px; }
.toolbar { display: flex; align-items: center; margin-bottom: 16px; }
.toolbar-note { margin-left: auto; color: #909399; font-size: 13px; }
</style>
