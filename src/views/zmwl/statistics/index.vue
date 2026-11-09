<template>
  <div class="app-container">
    <el-card class="filter-card">
      <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="80px">
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
          <school-activity-select v-model="query.instanceId" :school-id="query.schoolId" />
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
        <el-form-item label="发展方向" prop="directionCode">
          <el-select v-model="query.directionCode" clearable placeholder="全部方向">
            <el-option
              v-for="item in directions"
              :key="item.directionCode"
              :label="item.name"
              :value="item.directionCode"
            />
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
          <el-button type="success" icon="el-icon-download" :loading="exporting" @click="exportExcel">
            导出 Excel
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="12" class="stat-row">
      <el-col :span="4">
        <div class="stat-card"><div class="stat-value">{{ summary.participantCount || 0 }}</div><div class="stat-label">参与人数</div></div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card"><div class="stat-value success">{{ summary.finishedCount || 0 }}</div><div class="stat-label">已完成选择</div></div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card"><div class="stat-value">{{ summary.finishRate || 0 }}%</div><div class="stat-label">完成率</div></div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card"><div class="stat-value warning">{{ summary.undecidedCount || 0 }}</div><div class="stat-label">暂未确定</div></div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card"><div class="stat-value">{{ summary.topDirectionName || '-' }}</div><div class="stat-label">最受欢迎方向</div></div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card"><div class="stat-value">{{ summary.avgDurationSeconds || 0 }}s</div><div class="stat-label">平均选择用时</div></div>
      </el-col>
    </el-row>

    <el-alert v-if="analysis" :title="analysis" type="info" :closable="false" show-icon class="analysis" />

    <el-row :gutter="16">
      <el-col :span="13">
        <el-card class="table-card">
          <div slot="header"><span>各发展方向偏好占比</span></div>
          <el-table :data="directionStats" border size="small">
            <el-table-column prop="sortOrder" label="排序" width="60" align="center" />
            <el-table-column prop="name" label="发展方向" min-width="130" />
            <el-table-column prop="tagName" label="标签称号" min-width="120" />
            <el-table-column prop="selectedCount" label="人数" width="80" align="center" />
            <el-table-column label="占比" min-width="150">
              <template slot-scope="scope">
                <div class="rate-cell">
                  <el-progress
                    :percentage="Number(scope.row.rate) || 0"
                    :show-text="false"
                    :stroke-width="10"
                    class="rate-bar"
                  />
                  <span class="rate-text">{{ scope.row.rate }}%</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template slot-scope="scope">
                <el-tag :type="scope.row.status === '0' ? 'success' : 'info'" size="mini">
                  {{ scope.row.status === '0' ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="11">
        <el-card class="table-card">
          <div slot="header"><span>院系方向偏好</span></div>
          <el-table :data="departmentStats" border size="small" max-height="420">
            <el-table-column prop="departmentName" label="院系" min-width="150" show-overflow-tooltip />
            <el-table-column prop="participantCount" label="参与" width="70" align="center" />
            <el-table-column prop="finishedCount" label="完成" width="70" align="center" />
            <el-table-column prop="finishRate" label="完成率" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.finishRate }}%</template>
            </el-table-column>
            <el-table-column prop="topDirectionName" label="最受欢迎方向" min-width="130" show-overflow-tooltip>
              <template slot-scope="scope">{{ scope.row.topDirectionName || '-' }}</template>
            </el-table-column>
            <el-table-column label="该方向占比" width="110" align="center">
              <template slot-scope="scope">{{ scope.row.topDirectionRate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card student-card">
      <div slot="header">
        <span>学生明细</span>
        <span class="header-tip">共 {{ total }} 条，按参与记录倒序；导出不受分页影响</span>
      </div>
      <el-table v-loading="loading" :data="records" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="studentName" label="学生" width="100" align="center" />
        <el-table-column prop="studentNo" label="学号" width="130" align="center" />
        <el-table-column prop="schoolName" label="学校" min-width="150" align="center" />
        <el-table-column prop="departmentName" label="院系" min-width="130" align="center" />
        <el-table-column prop="major" label="专业" min-width="120" align="center" />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column prop="directionName" label="发展方向" min-width="130" align="center">
          <template slot-scope="scope">{{ scope.row.directionName || '未选择' }}</template>
        </el-table-column>
        <el-table-column prop="tagName" label="标签称号" min-width="120" align="center">
          <template slot-scope="scope">{{ scope.row.tagName || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === 'finished'" type="success" size="mini">已完成</el-tag>
            <el-tag v-else type="info" size="mini">进行中</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参与时间" width="155" align="center">
          <template slot-scope="scope">{{ formatDateTime(scope.row.scanTime) }}</template>
        </el-table-column>
        <el-table-column label="确认时间" width="155" align="center">
          <template slot-scope="scope">{{ formatDateTime(scope.row.finishTime) }}</template>
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
import { getStatistics, getConfig, exportStatisticsExcel, zmwlErrorMessage } from '@/api/zmwl'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'

export default {
  name: 'ZmwlStatistics',
  data() {
    return {
      loading: false,
      exporting: false,
      schools: [],
      departments: [],
      directions: [],
      dateRange: null,
      summary: {},
      directionStats: [],
      departmentStats: [],
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
        directionCode: null,
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
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
      getConfig()
        .then((res) => {
          this.directions = (res.data && res.data.directions) || []
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
    },
    schoolChanged(schoolId) {
      this.query.departmentId = null
      this.departments = []
      if (!schoolId) return
      listDepartment({ schoolId, pageNum: 1, pageSize: 1000 })
        .then((res) => {
          if (this.query.schoolId === schoolId) {
            this.departments = res.rows || res.data || []
          }
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
    },
    params() {
      const data = { ...this.query }
      if (this.dateRange && this.dateRange.length === 2) {
        data.startDate = this.dateRange[0]
        data.endDate = this.dateRange[1]
      }
      return data
    },
    load() {
      this.loading = true
      getStatistics(this.params())
        .then((res) => {
          const data = res.data || {}
          this.summary = data.summary || {}
          this.directionStats = data.directionStats || []
          this.departmentStats = data.departmentStats || []
          this.analysis = data.analysis || ''
          this.records = data.records || []
          this.total = Number(data.total != null ? data.total : this.records.length)
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
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
      if (!this.query.schoolId) {
        this.$modal.msgWarning('请先选择学校')
        return
      }
      if (!this.query.instanceId) {
        this.$modal.msgWarning('请先选择活动')
        return
      }
      this.exporting = true
      const params = this.params()
      delete params.pageNum
      delete params.pageSize
      exportStatisticsExcel(params)
        .then((blob) => {
          const link = document.createElement('a')
          link.href = window.URL.createObjectURL(blob)
          link.download = `职面未来学生数据_${this.query.schoolId}_${this.query.instanceId}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(link.href)
        })
        .catch((error) => this.$modal.msgError(zmwlErrorMessage(error)))
        .finally(() => {
          this.exporting = false
        })
    },
    indexMethod(index) {
      return (this.query.pageNum - 1) * this.query.pageSize + index + 1
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
  font-size: 22px;
  font-weight: 600;
  color: #1f2d3d;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stat-value.success {
  color: #67c23a;
}
.stat-value.warning {
  color: #e6a23c;
}
.stat-label {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}
.analysis {
  margin-bottom: 12px;
}
.table-card {
  margin-bottom: 16px;
}
.header-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}
.rate-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rate-bar {
  flex: 1;
}
.rate-text {
  width: 58px;
  color: #606266;
  font-size: 12px;
  text-align: right;
}
.student-card {
  margin-top: 4px;
}
</style>
