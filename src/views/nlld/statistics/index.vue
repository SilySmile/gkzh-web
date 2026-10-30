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
      <el-form-item label="结果" prop="resultType">
        <el-select v-model="query.resultType" clearable placeholder="全部结果">
          <el-option label="TOP2 类型" value="top2" />
          <el-option label="多元开放型" value="open" />
        </el-select>
      </el-form-item>
      <el-form-item label="TOP维度" prop="dimensionCode">
        <el-select v-model="query.dimensionCode" clearable filterable placeholder="全部维度">
          <el-option v-for="item in dimensions" :key="item.dimensionCode" :label="item.dimensionName" :value="item.dimensionCode" />
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
        <el-button v-hasPermi="['nlld:statistics:export']" type="success" icon="el-icon-download" :loading="exporting" @click="exportExcel">下载 Excel</el-button>
      </el-form-item>
    </el-form>
    <div class="export-tip">参与日期按扫码时间筛选，结束日期包含当天；下载 Excel 需先选择学校和活动，导出与当前筛选条件一致。</div>

    <el-row :gutter="16" class="summary-row">
      <el-col :span="4">
        <el-card shadow="never"><div class="metric-label">扫码参与人数</div><div class="metric-value">{{ summary.enteredCount || 0 }}</div></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never"><div class="metric-label">完成测评人数</div><div class="metric-value">{{ summary.completedCount || 0 }}</div></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never"><div class="metric-label">完成率</div><div class="metric-value">{{ summary.completionRate || 0 }}%</div></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never"><div class="metric-label">TOP2 类型</div><div class="metric-value">{{ summary.top2Count || 0 }} <span class="metric-sub">{{ summary.top2Rate || 0 }}%</span></div></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never"><div class="metric-label">多元开放型</div><div class="metric-value">{{ summary.openCount || 0 }} <span class="metric-sub">{{ summary.openRate || 0 }}%</span></div></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never"><div class="metric-label">保存截图人数</div><div class="metric-value">{{ summary.savedCount || 0 }} <span class="metric-sub">{{ summary.savedRate || 0 }}%</span></div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="section-card">
      <div slot="header" class="section-title">各价值观维度偏好占比统计</div>
      <el-table :data="dimensionStats" border stripe size="small">
        <el-table-column prop="serialNo" label="序号" width="60" align="center" />
        <el-table-column prop="dimensionName" label="维度" width="120" align="center" />
        <el-table-column prop="dimensionGroup" label="分组" width="190" align="center" />
        <el-table-column prop="selectedCount" label="被选次数" width="90" align="center" />
        <el-table-column label="选择占比" min-width="160">
          <template slot-scope="scope">
            <el-progress :percentage="Number(scope.row.selectedRate) || 0" :format="() => scope.row.selectedRate + '%'" />
          </template>
        </el-table-column>
        <el-table-column prop="twoPointCount" label="得2分人数" width="100" align="center" />
        <el-table-column label="偏好率" min-width="160">
          <template slot-scope="scope">
            <el-progress :percentage="Number(scope.row.twoPointRate) || 0" :color="'#67c23a'" :format="() => scope.row.twoPointRate + '%'" />
          </template>
        </el-table-column>
        <el-table-column prop="top2Count" label="进入TOP2" width="95" align="center" />
        <el-table-column label="TOP2占比" width="95" align="center">
          <template slot-scope="scope">{{ scope.row.top2Rate }}%</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never" class="section-card">
          <div slot="header" class="section-title">结果类型分布</div>
          <div v-for="item in resultTypeStats" :key="item.resultType" class="result-row">
            <span class="result-name">{{ item.resultName }}</span>
            <span class="result-count">{{ item.userCount }} 人</span>
            <el-progress :percentage="Number(item.probability) || 0" :status="item.resultType === 'top2' ? 'success' : 'warning'" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
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
        <el-table-column prop="top1DimensionName" label="TOP1" width="110" align="center" />
        <el-table-column prop="top2DimensionName" label="TOP2" width="110" align="center" />
        <el-table-column prop="resultTypeName" label="结果类型" width="110" align="center" />
        <el-table-column prop="answeredRounds" label="已答关数" width="90" align="center" />
        <el-table-column label="参与时间" width="155" align="center">
          <template slot-scope="scope">{{ formatTime(scope.row.scanTime) }}</template>
        </el-table-column>
        <el-table-column label="保存截图" width="100" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.posterSaved" type="success" size="mini">已保存</el-tag>
            <el-tag v-else type="info" size="mini">未保存</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="openDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="load" />
      <el-empty v-if="!loading && !rows.length" description="暂无统计数据" />
    </el-card>

    <el-dialog title="学生选择明细" :visible.sync="detailVisible" width="760px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="学生">{{ detail.studentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ detail.studentNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学校">{{ detail.schoolName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="活动">{{ detail.instanceName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="院系">{{ detail.departmentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ detail.major || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结果类型">{{ detail.resultTypeName || '未完成' }}</el-descriptions-item>
        <el-descriptions-item label="TOP1 / TOP2">
          {{ (detail.top1DimensionName || '—') + ' / ' + (detail.top2DimensionName || '—') }}
        </el-descriptions-item>
        <el-descriptions-item label="已答关数">{{ detail.answeredRounds || 0 }} / 6</el-descriptions-item>
        <el-descriptions-item label="参与时间">{{ formatTime(detail.scanTime) }}</el-descriptions-item>
        <el-descriptions-item label="保存截图">{{ detail.posterSavedName || '未保存' }}</el-descriptions-item>
      </el-descriptions>
      <div class="answers-title">6 关选择明细</div>
      <el-table :data="answers" border size="small" max-height="320">
        <el-table-column prop="roundNo" label="关卡" width="80" align="center">
          <template slot-scope="scope">第 {{ scope.row.roundNo }} 关</template>
        </el-table-column>
        <el-table-column prop="optionLabel" label="选项" width="70" align="center" />
        <el-table-column prop="optionName" label="物品" min-width="260" />
        <el-table-column prop="dimensionName" label="维度" width="140" align="center" />
      </el-table>
      <el-empty v-if="!answers.length" description="尚无已选物品" />
    </el-dialog>
  </div>
</template>

<script>
import { getStatistics, getRecord, exportStatisticsExcel, validateExcelBlob, listDimensions, nlldErrorMessage } from '@/api/nlld'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'
import { saveAs } from 'file-saver'

export default {
  name: 'NlldStatistics',
  data() {
    return {
      loading: false,
      exporting: false,
      total: 0,
      rows: [],
      summary: {},
      dimensionStats: [],
      resultTypeStats: [],
      analysis: '',
      detailVisible: false,
      detail: null,
      answers: [],
      schools: [],
      departments: [],
      activities: [],
      dimensions: [],
      query: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        resultType: null,
        dimensionCode: null,
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
        .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
      listInstances({})
        .then(res => {
          this.activities = res.data || res.rows || []
        })
        .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
      listDimensions()
        .then(res => {
          this.dimensions = res.data || []
        })
        .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
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
        .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
    },
    load() {
      if (this.invalidDateRange()) return
      this.loading = true
      getStatistics(this.query)
        .then(res => {
          const data = res.data || {}
          this.summary = data.summary || {}
          this.dimensionStats = data.dimensionStats || []
          this.resultTypeStats = data.resultTypeStats || []
          this.analysis = data.analysis || ''
          this.rows = data.records || []
          this.total = data.total || 0
        })
        .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
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
        resultType: null,
        dimensionCode: null,
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
    openDetail(row) {
      this.detail = row
      this.answers = []
      this.detailVisible = true
      getRecord(row.recordId)
        .then(res => {
          const data = res.data || {}
          this.detail = data.record || row
          this.answers = data.answers || []
        })
        .catch(error => this.$modal.msgError(nlldErrorMessage(error)))
    },
    async exportExcel() {
      if (this.exporting) return
      if (!this.query.schoolId || !this.query.instanceId) {
        return this.$modal.msgWarning('请先选择学校和活动，再下载 Excel')
      }
      if (this.invalidDateRange()) return
      const { schoolId, instanceId, departmentId, major, gender, studentNo, resultType, dimensionCode, startDate, endDate } = this.query
      this.exporting = true
      try {
        const blob = await exportStatisticsExcel({ schoolId, instanceId, departmentId, major, gender, studentNo, resultType, dimensionCode, startDate, endDate })
        await validateExcelBlob(blob)
        saveAs(blob, `能量雷达学生数据_${schoolId}_${instanceId}.xlsx`)
      } catch (error) {
        this.$modal.msgError(nlldErrorMessage(error))
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
.metric-sub {
  color: #909399;
  font-size: 14px;
  font-weight: 400;
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
  width: 90px;
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
.answers-title {
  margin: 18px 0 10px;
  font-weight: 600;
  color: #303133;
}
</style>
