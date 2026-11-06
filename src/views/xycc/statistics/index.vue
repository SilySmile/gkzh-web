<!-- 心愿橱窗统计分析：按学校、活动、院系、专业、性别、编码组合和完成日期筛选。 -->
<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="68px">
      <el-form-item label="学校" prop="schoolId">
        <el-select v-model="query.schoolId" clearable filterable placeholder="全部学校" @change="schoolChanged">
          <el-option v-for="item in schools" :key="item.schoolId" :label="item.title || item.name" :value="item.schoolId" />
        </el-select>
      </el-form-item>
      <el-form-item label="活动" prop="instanceId">
        <school-activity-select v-model="query.instanceId" :school-id="query.schoolId" />
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
      <el-form-item label="编码组合" prop="code">
        <el-input v-model.trim="query.code" clearable placeholder="如 RIA" @keyup.enter.native="search" />
      </el-form-item>
      <el-form-item label="开始日期" prop="startDate">
        <el-date-picker v-model="query.startDate" type="date" value-format="yyyy-MM-dd" clearable placeholder="完成开始日期" style="width: 150px" />
      </el-form-item>
      <el-form-item label="结束日期" prop="endDate">
        <el-date-picker v-model="query.endDate" type="date" value-format="yyyy-MM-dd" clearable placeholder="完成结束日期" style="width: 150px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="search">查询</el-button>
        <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
        <el-button v-hasPermi="['xycc:statistics:export']" type="success" icon="el-icon-download" :loading="exporting" @click="exportExcel">下载 Excel</el-button>
      </el-form-item>
    </el-form>
    <div class="export-tip">完成日期按选择结果创建时间筛选，结束日期包含当天；下载 Excel 需先选择学校和活动，导出范围与当前筛选条件一致，不受页码影响。</div>

    <el-row :gutter="16" class="summary-row">
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">完成人数</div><div class="metric-value">{{ summary.participantCount || 0 }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">编码组合数</div><div class="metric-value">{{ summary.codeCount || 0 }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">最高频编码</div><div class="metric-value code">{{ summary.topCode || '-' }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">最高频占比</div><div class="metric-value">{{ summary.topCodeProbability || 0 }}%</div></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="15">
        <el-card shadow="never" class="section-card">
          <div slot="header" class="section-title">复合编码分布</div>
          <el-table :data="codeStats" border stripe size="small">
            <el-table-column prop="serialNo" label="序号" width="55" align="center" />
            <el-table-column prop="code" label="编码" width="70" align="center" />
            <el-table-column prop="codeSummary" label="霍兰德类型" min-width="150" show-overflow-tooltip />
            <el-table-column prop="userCount" label="人数" width="70" align="center" />
            <el-table-column label="占比" width="150">
              <template slot-scope="scope">
                <el-progress :percentage="Number(scope.row.probability) || 0" :format="() => scope.row.probability + '%'" />
              </template>
            </el-table-column>
            <el-table-column prop="careerTitles" label="职业方向" min-width="180" show-overflow-tooltip />
            <el-table-column prop="envTitles" label="工作环境偏好" min-width="150" show-overflow-tooltip />
          </el-table>
          <el-empty v-if="!codeStats.length" description="暂无编码统计数据" />
        </el-card>
      </el-col>
      <el-col :span="9">
        <el-card shadow="never" class="section-card analysis-card">
          <div slot="header" class="section-title">简要分析</div>
          <div class="analysis-text">{{ analysis || '暂无分析结果' }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="section-card">
      <div slot="header" class="section-title">学生明细</div>
      <el-table v-loading="loading" :data="rows" border stripe size="small">
        <el-table-column type="index" :index="rowIndex" label="#" width="55" align="center" />
        <el-table-column prop="studentName" label="学生" width="110" align="center" />
        <el-table-column prop="studentNo" label="学号" width="130" align="center" />
        <el-table-column prop="schoolName" label="学校" min-width="150" show-overflow-tooltip />
        <el-table-column prop="departmentName" label="院系" min-width="140" show-overflow-tooltip />
        <el-table-column prop="major" label="专业" min-width="120" show-overflow-tooltip />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column prop="patternComboCode" label="编码" width="80" align="center" />
        <el-table-column prop="patternNames" label="选择图案" min-width="180" show-overflow-tooltip />
        <el-table-column prop="codeSummary" label="霍兰德类型" min-width="150" show-overflow-tooltip />
        <el-table-column prop="careerTitles" label="职业方向" min-width="190" show-overflow-tooltip />
        <el-table-column prop="envTitles" label="工作环境偏好" min-width="150" show-overflow-tooltip />
        <el-table-column label="完成时间" width="155" align="center">
          <template slot-scope="scope">{{ formatTime(scope.row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="load" />
      <el-empty v-if="!loading && !rows.length" description="暂无统计数据" />
    </el-card>
  </div>
</template>

<script>
import { getStatistics, exportStatisticsExcel, validateExcelBlob, xyccErrorMessage } from '@/api/xycc/statistics'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'
import { saveAs } from 'file-saver'

export default {
  name: 'XyccStatistics',
  data() {
    return {
      loading: false,
      exporting: false,
      total: 0,
      rows: [],
      summary: {},
      codeStats: [],
      analysis: '',
      schools: [],
      departments: [],
      activities: [],
      query: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        code: null,
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
        .catch(error => this.$modal.msgError(xyccErrorMessage(error)))
      listInstances({})
        .then(res => {
          this.activities = res.data || res.rows || []
        })
        .catch(error => this.$modal.msgError(xyccErrorMessage(error)))
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
        .catch(error => this.$modal.msgError(xyccErrorMessage(error)))
    },
    load() {
      if (this.invalidDateRange()) return
      this.loading = true
      getStatistics(this.query)
        .then(res => {
          const data = res.data || {}
          this.summary = data.summary || {}
          this.codeStats = data.codeStats || []
          this.analysis = data.analysis || ''
          this.rows = data.records || []
          this.total = data.total || 0
        })
        .catch(error => this.$modal.msgError(xyccErrorMessage(error)))
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
        code: null,
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
      const { schoolId, instanceId, departmentId, major, studentNo, gender, code, startDate, endDate } = this.query
      this.exporting = true
      try {
        const blob = await exportStatisticsExcel({ schoolId, instanceId, departmentId, major, studentNo, gender, code, startDate, endDate })
        await validateExcelBlob(blob)
        saveAs(blob, `心愿橱窗统计_${schoolId}_${instanceId}.xlsx`)
      } catch (error) {
        this.$modal.msgError(xyccErrorMessage(error))
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
.metric-value.code {
  color: #409eff;
}
.section-card {
  margin-bottom: 18px;
}
.section-title {
  font-weight: 600;
  color: #303133;
}
.analysis-card .analysis-text {
  color: #34495e;
  line-height: 1.9;
  white-space: pre-wrap;
}
</style>
