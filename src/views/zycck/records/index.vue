<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="68px">
      <el-form-item label="学校" prop="schoolId"><el-select v-model="query.schoolId" clearable filterable placeholder="全部学校" @change="schoolChanged"><el-option v-for="item in schools" :key="item.schoolId" :label="item.title || item.name" :value="item.schoolId" /></el-select></el-form-item>
      <el-form-item label="院系" prop="departmentId"><el-select v-model="query.departmentId" clearable filterable placeholder="全部院系"><el-option v-for="item in departments" :key="item.departmentId" :label="item.name || item.title" :value="item.departmentId" /></el-select></el-form-item>
      <el-form-item label="专业" prop="major"><el-input v-model="query.major" clearable placeholder="请输入专业" @keyup.enter.native="search" /></el-form-item>
      <el-form-item label="性别" prop="gender"><el-select v-model="query.gender" clearable placeholder="全部"><el-option label="男" value="男" /><el-option label="女" value="女" /><el-option label="其他/未填" value="其他" /></el-select></el-form-item>
      <el-form-item label="活动" prop="instanceId"><el-select v-model="query.instanceId" clearable filterable placeholder="全部活动"><el-option v-for="item in activities" :key="item.instanceId" :label="item.title || item.name" :value="item.instanceId" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" icon="el-icon-search" @click="search">查询</el-button><el-button icon="el-icon-refresh" @click="reset">重置</el-button></el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="records" border stripe>
      <el-table-column prop="recordId" label="记录 ID" width="90" align="center" />
      <el-table-column prop="studentName" label="学生姓名" width="120" align="center" />
      <el-table-column prop="studentNo" label="学号" width="130" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="150" align="center" />
      <el-table-column prop="departmentName" label="院系/专业" min-width="160" align="center" />
      <el-table-column prop="major" label="专业" min-width="120" align="center" />
      <el-table-column prop="gender" label="性别" width="80" align="center" />
      <el-table-column prop="instanceId" label="活动实例" width="100" align="center" />
      <el-table-column label="状态" width="100" align="center"><template slot-scope="scope"><el-tag :type="scope.row.status === 'finished' ? 'success' : 'info'">{{ statusText(scope.row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="画像参与" width="100" align="center"><template slot-scope="scope">{{ scope.row.participatePortrait === '1' || scope.row.participatePortrait === true ? '是' : '否' }}</template></el-table-column>
      <el-table-column prop="scanTime" label="参与时间" width="170" align="center" />
      <el-table-column prop="finishTime" label="完成时间" width="170" align="center" />
      <el-table-column label="操作" width="90" fixed="right" align="center"><template slot-scope="scope"><el-button type="text" size="small" class="danger-text" @click="remove(scope.row)">删除</el-button></template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="load" />
    <el-empty v-if="!loading && !records.length" description="暂无符合条件的活动记录" />
  </div>
</template>

<script>
import { listRecords, deleteRecord, zycckErrorMessage } from '@/api/zycck'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'ZycckRecords',
  data() { return { loading: false, records: [], total: 0, schools: [], departments: [], activities: [], query: { pageNum: 1, pageSize: 10, schoolId: null, departmentId: null, major: null, gender: null, instanceId: null } } },
  created() { this.loadOptions(); this.load() },
  methods: {
    statusText(status) { return ({ entered: '已参与', question: '竞猜中', explore: '探索中', finished: '已完成' })[status] || '进行中' },
    loadOptions() { listSchool({ pageNum: 1, pageSize: 1000 }).then(res => { this.schools = res.rows || res.data || [] }).catch(error => this.$modal.msgError(zycckErrorMessage(error))); listInstances({}).then(res => { this.activities = res.data || res.rows || [] }).catch(error => this.$modal.msgError(zycckErrorMessage(error))) },
    schoolChanged(schoolId) { this.query.departmentId = null; this.departments = []; if (!schoolId) return; listDepartment({ schoolId, pageNum: 1, pageSize: 1000 }).then(res => { this.departments = res.rows || res.data || [] }).catch(error => this.$modal.msgError(zycckErrorMessage(error))) },
    load() { this.loading = true; listRecords({ ...this.query, gameType: 'zycck' }).then(res => { this.records = res.rows || res.data || []; this.total = res.total || this.records.length }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.loading = false }) },
    remove(row) { this.$modal.confirm('确认删除该学生在当前活动中的职业猜猜看记录吗？删除后可重新扫码参与。').then(() => deleteRecord(row.recordId)).then(() => { this.$modal.msgSuccess('记录已删除'); this.load() }).catch(error => { if (error) this.$modal.msgError(zycckErrorMessage(error)) }) },
    search() { this.query.pageNum = 1; this.load() },
    reset() { this.$refs.queryForm.resetFields(); this.search() }
  }
}
</script>

<style scoped>
.danger-text { color: #f56c6c; }
/deep/ .el-table th, /deep/ .el-table td { text-align: center; }
/deep/ .el-tag { text-align: center; }
</style>
