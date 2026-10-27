<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="68px">
      <el-form-item label="学校" prop="schoolId">
        <el-select v-model="query.schoolId" clearable filterable placeholder="全部学校" @change="schoolChanged">
          <el-option v-for="item in schools" :key="item.schoolId" :label="item.title || item.name" :value="item.schoolId" />
        </el-select>
      </el-form-item>
      <el-form-item label="活动" prop="instanceId">
        <el-select v-model="query.instanceId" clearable filterable placeholder="全部活动">
          <el-option v-for="item in activities" :key="item.instanceId" :label="item.title || item.name" :value="item.instanceId" />
        </el-select>
      </el-form-item>
      <el-form-item label="院系" prop="departmentId">
        <el-select v-model="query.departmentId" clearable filterable placeholder="全部院系">
          <el-option v-for="item in departments" :key="item.departmentId" :label="item.title || item.name" :value="item.departmentId" />
        </el-select>
      </el-form-item>
      <el-form-item label="专业" prop="major">
        <el-input v-model.trim="query.major" clearable placeholder="专业名称" @keyup.enter.native="search" />
      </el-form-item>
      <el-form-item label="学号" prop="studentNo">
        <el-input v-model.trim="query.studentNo" clearable placeholder="学号" @keyup.enter.native="search" />
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select v-model="query.gender" clearable placeholder="全部">
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
          <el-option label="其他/未填" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="角色" prop="roleId">
        <el-select v-model="query.roleId" clearable placeholder="全部角色">
          <el-option v-for="item in roles" :key="item.roleId" :label="item.roleName + '（' + item.jobTitle + '）'" :value="item.roleId" />
        </el-select>
      </el-form-item>
      <el-form-item label="结果" prop="result">
        <el-select v-model="query.result" clearable placeholder="全部结果">
          <el-option label="胜利" value="win" />
          <el-option label="失败" value="lose" />
          <el-option label="平局" value="draw" />
        </el-select>
      </el-form-item>
      <el-form-item label="开始日期" prop="startDate">
        <el-date-picker v-model="query.startDate" type="date" value-format="yyyy-MM-dd" clearable placeholder="参与开始日期" style="width: 150px" />
      </el-form-item>
      <el-form-item label="结束日期" prop="endDate">
        <el-date-picker v-model="query.endDate" type="date" value-format="yyyy-MM-dd" clearable placeholder="参与结束日期" style="width: 150px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="search">查询</el-button>
        <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
        <el-button v-hasPermi="['zyjdc:statistics:export']" type="success" icon="el-icon-download" :loading="exporting" @click="exportExcel">下载 Excel</el-button>
      </el-form-item>
    </el-form>
    <div class="export-tip">参与日期按扫码时间筛选，结束日期包含当天；下载 Excel 需先选择学校和活动，导出不受当前页码和列表筛选影响（与当前条件一致）。</div>

    <el-row :gutter="16" class="summary-row">
      <el-col :span="5">
        <el-card shadow="never"><div class="metric-label">扫码参与人数</div><div class="metric-value">{{ summary.enteredCount || 0 }}</div></el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="never"><div class="metric-label">完成角色选择</div><div class="metric-value">{{ summary.selectedCount || 0 }}</div></el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="never"><div class="metric-label">通关人数</div><div class="metric-value">{{ summary.completedCount || 0 }}</div></el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="never"><div class="metric-label">完成率</div><div class="metric-value">{{ summary.completionRate || 0 }}%</div></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never"><div class="metric-label">平均尝试次数</div><div class="metric-value">{{ summary.averageAttempts || 0 }}</div></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="15">
        <el-card shadow="never" class="section-card">
          <div slot="header" class="section-title">各角色偏好占比统计</div>
          <el-table :data="roleStats" border stripe size="small">
            <el-table-column prop="serialNo" label="序号" width="60" align="center" />
            <el-table-column prop="roleName" label="动物角色" width="90" align="center" />
            <el-table-column prop="jobTitle" label="职场定位" min-width="150" show-overflow-tooltip />
            <el-table-column prop="rankLevel" label="等级" width="70" align="center" />
            <el-table-column prop="userCount" label="选择人数" width="85" align="center" />
            <el-table-column label="偏好占比" min-width="170">
              <template slot-scope="scope">
                <el-progress :percentage="Number(scope.row.probability) || 0" :format="() => scope.row.probability + '%'" />
              </template>
            </el-table-column>
            <el-table-column prop="finishedCount" label="通关" width="70" align="center" />
            <el-table-column label="完成率" width="80" align="center">
              <template slot-scope="scope">{{ scope.row.completionRate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="9">
        <el-card shadow="never" class="section-card">
          <div slot="header" class="section-title">对局结果分布</div>
          <div v-for="item in resultStats" :key="item.result" class="result-row">
            <span class="result-name">{{ item.resultName }}</span>
            <span class="result-count">{{ item.userCount }} 人</span>
            <el-progress :percentage="Number(item.probability) || 0" :status="item.result === 'win' ? 'success' : (item.result === 'lose' ? 'exception' : 'warning')" />
          </div>
        </el-card>
        <el-card shadow="never" class="section-card analysis-card">
          <div slot="header" class="section-title">整体偏好分析</div>
          <div class="analysis-text">{{ analysis || '暂无分析结果' }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="section-card">
      <div slot="header" class="section-title">学生明细</div>
      <el-table v-loading="loading" :data="rows" border stripe size="small">
        <el-table-column type="index" :index="rowIndex" label="#" width="55" align="center" />
        <el-table-column prop="studentName" label="学生" width="100" align="center" />
        <el-table-column prop="studentNo" label="学号" width="125" align="center" />
        <el-table-column prop="schoolName" label="学校" min-width="140" show-overflow-tooltip />
        <el-table-column prop="departmentName" label="院系" min-width="140" show-overflow-tooltip />
        <el-table-column prop="major" label="专业" min-width="120" show-overflow-tooltip />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column prop="roleName" label="角色" width="90" align="center" />
        <el-table-column prop="jobTitle" label="职场定位" min-width="140" show-overflow-tooltip />
        <el-table-column prop="resultName" label="结果" width="80" align="center" />
        <el-table-column prop="attemptNo" label="尝试" width="70" align="center" />
        <el-table-column label="参与时间" width="155" align="center">
          <template slot-scope="scope">{{ formatTime(scope.row.scanTime) }}</template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="load" />
      <el-empty v-if="!loading && !rows.length" description="暂无统计数据" />
    </el-card>
  </div>
</template>

<script>
import { getStatistics, exportStatisticsExcel, validateExcelBlob, listRoles, zyjdcErrorMessage } from '@/api/zyjdc'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'
import { saveAs } from 'file-saver'

export default {
  name: 'ZyjdcStatistics',
  data() {
    return {
      loading: false,
      exporting: false,
      total: 0,
      rows: [],
      summary: {},
      roleStats: [],
      resultStats: [],
      analysis: '',
      schools: [],
      departments: [],
      activities: [],
      roles: [],
      query: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        roleId: null,
        result: null,
        startDate: null,
        endDate: null
      }
    }
  },
  created() {
    this.loadOptions()
    this.load()
  },
  methods: {
    loadOptions() {
      listSchool({ pageNum: 1, pageSize: 1000 })
        .then(res => {
          this.schools = res.rows || res.data || []
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
      listInstances({})
        .then(res => {
          this.activities = res.data || res.rows || []
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
      listRoles()
        .then(res => {
          this.roles = res.data || []
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
    },
    schoolChanged(schoolId) {
      this.query.departmentId = null
      this.departments = []
      if (!schoolId) return
      listDepartment({ schoolId, pageNum: 1, pageSize: 1000 })
        .then(res => {
          if (this.query.schoolId === schoolId) {
            this.departments = (res.rows || res.data || []).filter(item => Number(item.parentId || 0) === 0)
          }
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
    },
    load() {
      if (this.invalidDateRange()) return
      this.loading = true
      getStatistics(this.query)
        .then(res => {
          const data = res.data || {}
          this.summary = data.summary || {}
          this.roleStats = data.roleStats || []
          this.resultStats = data.resultStats || []
          this.analysis = data.analysis || ''
          this.rows = data.records || []
          this.total = data.total || 0
        })
        .catch(error => this.$modal.msgError(zyjdcErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    search() {
      this.query.pageNum = 1
      this.load()
    },
    reset() {
      this.query = {
        pageNum: 1,
        pageSize: this.query.pageSize,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        roleId: null,
        result: null,
        startDate: null,
        endDate: null
      }
      this.departments = []
      this.load()
    },
    invalidDateRange() {
      if (this.query.startDate && this.query.endDate && this.query.startDate > this.query.endDate) {
        this.$modal.msgWarning('开始日期不能晚于结束日期')
        return true
      }
      return false
    },
    rowIndex(index) {
      return (this.query.pageNum - 1) * this.query.pageSize + index + 1
    },
    async exportExcel() {
      if (this.exporting) return
      if (!this.query.schoolId || !this.query.instanceId) {
        return this.$modal.msgWarning('请先选择学校和活动，再下载 Excel')
      }
      if (this.invalidDateRange()) return
      const { schoolId, instanceId, departmentId, major, gender, studentNo, roleId, result, startDate, endDate } = this.query
      this.exporting = true
      try {
        const blob = await exportStatisticsExcel({ schoolId, instanceId, departmentId, major, gender, studentNo, roleId, result, startDate, endDate })
        await validateExcelBlob(blob)
        saveAs(blob, `职业角斗场学生数据_${schoolId}_${instanceId}.xlsx`)
      } catch (error) {
        this.$modal.msgError(zyjdcErrorMessage(error))
      } finally {
        this.exporting = false
      }
    },
    formatTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (isNaN(date.getTime())) return String(value)
      const pad = n => (n < 10 ? '0' + n : '' + n)
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
    }
  }
}
</script>

<style scoped>
.summary-row {
  margin-bottom: 18px;
}
.export-tip {
  margin-bottom: 16px;
  color: #909399;
  font-size: 13px;
}
.metric-label {
  color: #909399;
  font-size: 13px;
}
.metric-value {
  margin-top: 8px;
  color: #303133;
  font-size: 26px;
  font-weight: 600;
}
.section-card {
  margin-bottom: 18px;
}
.section-title {
  font-weight: 600;
  color: #303133;
}
.result-row {
  margin-bottom: 16px;
}
.result-name {
  display: inline-block;
  width: 60px;
  color: #606266;
}
.result-count {
  float: right;
  color: #303133;
  font-weight: 600;
}
.analysis-card .analysis-text {
  color: #34495e;
  line-height: 1.9;
  white-space: pre-wrap;
}
</style>
