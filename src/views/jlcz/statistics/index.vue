<template>
  <div class="app-container">
    <el-card class="filter-card">
      <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="68px">
        <el-form-item label="学校" prop="schoolId">
          <el-select v-model="query.schoolId" clearable filterable placeholder="全部学校" @change="schoolChanged">
            <el-option
              v-for="item in schools"
              :key="item.schoolId"
              :label="item.title || item.name"
              :value="item.schoolId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动" prop="instanceId">
          <el-select v-model="query.instanceId" clearable filterable placeholder="全部活动">
            <el-option
              v-for="item in activities"
              :key="item.instanceId"
              :label="item.title || item.name"
              :value="item.instanceId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="院系" prop="departmentId">
          <el-select v-model="query.departmentId" clearable filterable placeholder="全部院系">
            <el-option
              v-for="item in departments"
              :key="item.departmentId"
              :label="item.name || item.title"
              :value="item.departmentId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-input v-model.trim="query.major" clearable placeholder="请输入专业" @keyup.enter.native="search" />
        </el-form-item>
        <el-form-item label="学号" prop="studentNo">
          <el-input v-model.trim="query.studentNo" clearable placeholder="请输入学号" @keyup.enter.native="search" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="query.gender" clearable placeholder="全部">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
            <el-option label="其他/未填" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="结果" prop="resultFilter">
          <el-select v-model="query.resultFilter" clearable placeholder="全部结果">
            <el-option label="通关" value="pass" />
            <el-option label="未通关" value="fail" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="statusFilter">
          <el-select v-model="query.statusFilter" clearable placeholder="全部状态">
            <el-option label="进行中" value="inProgress" />
            <el-option label="已完成" value="finished" />
          </el-select>
        </el-form-item>
        <el-form-item label="参与日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="search">查询</el-button>
          <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
          <el-button type="success" icon="el-icon-download" :loading="exporting" @click="exportExcel">导出 Excel</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="12" class="stat-row">
      <el-col :span="3">
        <div class="stat-card"><div class="stat-value">{{ summary.participantCount || 0 }}</div><div class="stat-label">参与人数</div></div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card"><div class="stat-value">{{ summary.finishedCount || 0 }}</div><div class="stat-label">已称重</div></div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card"><div class="stat-value success">{{ summary.passCount || 0 }}</div><div class="stat-label">通关人数</div></div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card"><div class="stat-value">{{ summary.passRate || 0 }}%</div><div class="stat-label">通关率</div></div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card"><div class="stat-value">{{ summary.avgTotalWeight || 0 }}g</div><div class="stat-label">平均简历分量</div></div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card"><div class="stat-value">{{ summary.avgSelectedCount || 0 }}</div><div class="stat-label">平均勾选砝码</div></div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card"><div class="stat-value">{{ summary.avgDurationSeconds || 0 }}s</div><div class="stat-label">平均称重用时</div></div>
      </el-col>
    </el-row>

    <el-alert
      v-if="analysis"
      :title="analysis"
      type="info"
      :closable="false"
      show-icon
      class="analysis"
    />

    <el-row :gutter="16">
      <el-col :span="10">
        <el-card class="table-card">
          <div slot="header"><span>四大类砝码获得情况</span></div>
          <el-table :data="categoryStats" border size="small">
            <el-table-column prop="categoryName" label="类别" min-width="170" />
            <el-table-column prop="availableWeight" label="可获重量" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.availableWeight }}g</template>
            </el-table-column>
            <el-table-column prop="avgWeightPerParticipant" label="人均获得" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.avgWeightPerParticipant }}g</template>
            </el-table-column>
            <el-table-column label="选择率" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.selectionRate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
        <el-card class="table-card">
          <div slot="header"><span>简历总重区间分布</span></div>
          <el-table :data="distribution" border size="small">
            <el-table-column prop="label" label="总重区间" />
            <el-table-column prop="count" label="人数" width="90" align="center" />
            <el-table-column label="占比" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.rate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card class="table-card">
          <div slot="header">
            <span>20 个砝码选择率与缺口</span>
            <span class="header-tip">选择率 = 勾选人数 ÷ 已称重人数</span>
          </div>
          <el-table :data="weightStats" border size="small" max-height="520">
            <el-table-column prop="weightNo" label="编号" width="60" align="center" />
            <el-table-column label="砝码" min-width="130">
              <template slot-scope="scope">{{ scope.row.icon }} {{ scope.row.label }}</template>
            </el-table-column>
            <el-table-column prop="categoryName" label="类别" min-width="150" show-overflow-tooltip />
            <el-table-column prop="weightG" label="重量" width="70" align="center">
              <template slot-scope="scope">{{ scope.row.weightG }}g</template>
            </el-table-column>
            <el-table-column prop="selectedCount" label="勾选" width="70" align="center" />
            <el-table-column label="选择率" width="150" align="center">
              <template slot-scope="scope">
                <el-progress :percentage="Number(scope.row.selectedRate) || 0" :stroke-width="10" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="70" align="center">
              <template slot-scope="scope">
                <el-tag :type="scope.row.status === '0' ? 'success' : 'info'" size="mini">
                  {{ scope.row.status === '0' ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <div slot="header"><span>学生明细（{{ total }} 条）</span></div>
      <el-table v-loading="loading" :data="records" border stripe size="small">
        <el-table-column prop="studentName" label="学生" width="100" align="center" />
        <el-table-column prop="studentNo" label="学号" width="120" align="center" />
        <el-table-column prop="departmentName" label="院系" min-width="130" align="center" />
        <el-table-column prop="major" label="专业" min-width="110" align="center" />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column label="总重量" width="90" align="center">
          <template slot-scope="scope">{{ scope.row.status === 'finished' ? scope.row.totalWeight + 'g' : '-' }}</template>
        </el-table-column>
        <el-table-column label="结果" width="90" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status !== 'finished'" type="info" size="mini">进行中</el-tag>
            <el-tag v-else-if="scope.row.result === 'pass'" type="success" size="mini">通关</el-tag>
            <el-tag v-else type="danger" size="mini">未通关</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="selectedCount" label="勾选数" width="80" align="center" />
        <el-table-column prop="attemptNo" label="次数" width="70" align="center" />
        <el-table-column label="用时" width="90" align="center">
          <template slot-scope="scope">{{ seconds(scope.row.durationMs) }}</template>
        </el-table-column>
        <el-table-column label="参与时间" width="160" align="center">
          <template slot-scope="scope">{{ formatDateTime(scope.row.scanTime) }}</template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="query.pageNum"
        :limit.sync="query.pageSize"
        @pagination="load"
      />
    </el-card>
  </div>
</template>

<script>
import { getStatistics, exportStatisticsExcel, jlczErrorMessage } from '@/api/jlcz'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'JlczStatistics',
  data() {
    return {
      loading: false,
      exporting: false,
      schools: [],
      departments: [],
      activities: [],
      dateRange: null,
      summary: {},
      weightStats: [],
      categoryStats: [],
      distribution: [],
      analysis: '',
      records: [],
      total: 0,
      query: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        resultFilter: null,
        statusFilter: null,
      },
    }
  },
  created() {
    this.loadOptions()
    this.load()
  },
  methods: {
    loadOptions() {
      listSchool({ pageNum: 1, pageSize: 1000 })
        .then((res) => {
          this.schools = res.rows || res.data || []
        })
        .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
      listInstances({})
        .then((res) => {
          this.activities = res.data || res.rows || []
        })
        .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
    },
    schoolChanged(schoolId) {
      this.query.departmentId = null
      this.query.instanceId = null
      this.departments = []
      if (!schoolId) return
      listDepartment({ schoolId, pageNum: 1, pageSize: 1000 })
        .then((res) => {
          if (this.query.schoolId === schoolId) {
            this.departments = res.rows || res.data || []
          }
        })
        .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
    },
    params() {
      const params = { ...this.query }
      if (this.dateRange && this.dateRange.length === 2) {
        params.startDate = this.dateRange[0]
        params.endDate = this.dateRange[1]
      }
      return params
    },
    load() {
      this.loading = true
      getStatistics(this.params())
        .then((res) => {
          const data = res.data || {}
          this.summary = data.summary || {}
          this.weightStats = data.weightStats || []
          this.categoryStats = data.categoryStats || []
          this.distribution = data.distribution || []
          this.analysis = data.analysis || ''
          this.records = data.records || []
          this.total = Number(data.total != null ? data.total : this.records.length)
        })
        .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    search() {
      this.query.pageNum = 1
      this.load()
    },
    reset() {
      this.$refs.queryForm.resetFields()
      this.dateRange = null
      this.departments = []
      this.search()
    },
    exportExcel() {
      if (!this.query.schoolId || !this.query.instanceId) {
        this.$modal.msgWarning('请先选择学校和活动后再导出')
        return
      }
      this.exporting = true
      const params = this.params()
      delete params.pageNum
      delete params.pageSize
      exportStatisticsExcel(params)
        .then((blob) => {
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `简历称重学生数据_${this.query.schoolId}_${this.query.instanceId}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          this.$modal.msgSuccess('导出成功')
        })
        .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
        .finally(() => {
          this.exporting = false
        })
    },
    seconds(value) {
      if (value == null || value === '') return '-'
      return `${(Number(value) / 1000).toFixed(1)} 秒`
    },
    formatDateTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      const pad = (n) => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
        date.getHours()
      )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },
  },
}
</script>

<style scoped>
.filter-card {
  margin-bottom: 12px;
}
.stat-row {
  margin-bottom: 12px;
}
.stat-card {
  padding: 14px 8px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  text-align: center;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}
.stat-value.success {
  color: #67c23a;
}
.stat-label {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}
.analysis {
  margin-bottom: 12px;
  line-height: 1.7;
}
.table-card {
  margin-bottom: 14px;
}
.header-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
/deep/ .el-table th {
  background: #f5f7fa;
}
</style>
