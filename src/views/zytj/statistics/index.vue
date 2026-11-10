<template>
  <div class="app-container">
    <el-card class="filter-card" shadow="never">
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
        <el-form-item label="人格类型" prop="typeCode">
          <el-select v-model="query.typeCode" clearable filterable placeholder="全部类型">
            <el-option v-for="item in types" :key="item.typeCode" :label="item.typeCode" :value="item.typeCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="statusFilter">
          <el-select v-model="query.statusFilter" clearable placeholder="全部状态">
            <el-option label="进行中" value="inProgress" />
            <el-option label="已提交" value="finished" />
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
        <div class="stat-card">
          <div class="stat-value">{{ summary.participantCount || 0 }}</div>
          <div class="stat-label">扫码参与（人）</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-value success">{{ summary.finishedCount || 0 }}</div>
          <div class="stat-label">已生成探索卡（人）</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-value">{{ summary.finishRate || 0 }}%</div>
          <div class="stat-label">完成率</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-value warning">{{ summary.timeoutCount || 0 }}</div>
          <div class="stat-label">超时自动提交（人）</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-value">{{ summary.typeCount || 0 }}</div>
          <div class="stat-label">出现型别数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="stat-value">{{ summary.avgDurationSeconds || 0 }}s</div>
          <div class="stat-label">平均用时</div>
        </div>
      </el-col>
    </el-row>

    <el-card class="analysis" shadow="never">
      <div slot="header">
        <span>整体概况</span>
        <span class="header-tip">占比以已生成探索卡人数为分母，同一学生只计一次</span>
      </div>
      <div class="analysis-text">
        占比最高的人格类型：
        <span class="type-code">{{ summary.topTypeCode || '-' }}</span>
        <span v-if="summary.topTypeCount">（{{ summary.topTypeCount }} 人，{{ summary.topTypeRate }}%）</span>
        <span v-if="summary.topTypeFeature" class="analysis-feature">{{ summary.topTypeFeature }}</span>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div slot="header">
        <span>16 型人格分布</span>
        <span class="header-tip">学校端第一页：人格类型整体数据</span>
      </div>
      <el-table v-loading="loading" :data="typeStats" border stripe max-height="440">
        <el-table-column prop="typeCode" label="人格类型" width="100" align="center" />
        <el-table-column label="人数" width="80" align="center">
          <template slot-scope="scope">{{ scope.row.selectedCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="占比" min-width="180" align="center">
          <template slot-scope="scope">
            <div class="rate-cell">
              <el-progress
                class="rate-bar"
                :percentage="Number(scope.row.rate) || 0"
                :show-text="false"
                :stroke-width="10"
                color="#5b6cff"
              />
              <span class="rate-text">{{ scope.row.rate || 0 }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="feature" label="性格特点" min-width="230" show-overflow-tooltip />
        <el-table-column prop="careerField" label="适合职业领域" min-width="190" show-overflow-tooltip />
        <el-table-column prop="typicalCareers" label="典型职业" min-width="230" show-overflow-tooltip />
      </el-table>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div slot="header">
        <span>四个维度倾向</span>
        <span class="header-tip">按所选物品的四列位置拆分统计</span>
      </div>
      <el-row :gutter="12">
        <el-col v-for="group in dimensionGroups" :key="group.code" :span="6">
          <div class="dimension-box">
            <div class="dimension-title">{{ group.name }}</div>
            <div v-for="row in group.rows" :key="row.letter" class="dimension-row">
              <span class="dimension-letter">{{ row.letter }}</span>
              <span class="dimension-item">{{ row.itemName || '-' }}</span>
              <el-progress
                class="dimension-bar"
                :percentage="Number(row.rate) || 0"
                :show-text="false"
                :stroke-width="8"
                color="#67c23a"
              />
              <span class="dimension-count">{{ row.selectedCount || 0 }}人 {{ row.rate || 0 }}%</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div slot="header">
        <span>院系分布</span>
        <span class="header-tip">院系取专业的父部门，未填写专业归入“未填写院系”</span>
      </div>
      <el-table v-loading="loading" :data="departmentStats" border stripe max-height="360">
        <el-table-column prop="departmentName" label="院系" min-width="220" />
        <el-table-column prop="participantCount" label="参与人数" width="110" align="center" />
        <el-table-column prop="finishedCount" label="已提交人数" width="120" align="center" />
        <el-table-column label="参与占比" min-width="180" align="center">
          <template slot-scope="scope">
            <div class="rate-cell">
              <el-progress
                class="rate-bar"
                :percentage="Number(scope.row.rate) || 0"
                :show-text="false"
                :stroke-width="10"
                color="#e6a23c"
              />
              <span class="rate-text">{{ scope.row.rate || 0 }}%</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="student-card" shadow="never">
      <div slot="header">
        <span>学生明细</span>
        <span class="header-tip">共 {{ total }} 条，按当前筛选条件分页展示</span>
      </div>
      <el-table v-loading="loading" :data="records" border stripe>
        <el-table-column label="序号" width="60" align="center">
          <template slot-scope="scope">{{ indexMethod(scope.$index) }}</template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" width="130" align="center" />
        <el-table-column prop="studentName" label="姓名" width="100" align="center" />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column prop="departmentName" label="院系" min-width="150" align="center" />
        <el-table-column prop="major" label="专业" min-width="130" align="center" />
        <el-table-column label="人格类型" width="100" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.typeCode" class="type-code">{{ scope.row.typeCode }}</span>
            <span v-else class="muted">未提交</span>
          </template>
        </el-table-column>
        <el-table-column prop="typicalCareers" label="典型职业" min-width="220" show-overflow-tooltip />
        <el-table-column label="超时" width="70" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.isTimeout" type="warning" size="mini">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
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
import { getStatistics, getConfig, exportStatisticsExcel, zytjErrorMessage } from '@/api/zytj'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'

export default {
  name: 'ZytjStatistics',
  data() {
    return {
      loading: false,
      exporting: false,
      schools: [],
      departments: [],
      types: [],
      dateRange: null,
      summary: {},
      typeStats: [],
      dimensionStats: [],
      departmentStats: [],
      records: [],
      total: 0,
      query: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        typeCode: null,
        statusFilter: null,
      },
    }
  },
  computed: {
    /** 把八个字母按四个维度分组，便于分栏展示。 */
    dimensionGroups() {
      const names = { EI: '外向 / 内向', SN: '实感 / 直觉', TF: '思考 / 情感', JP: '判断 / 感知' }
      const groups = []
      for (const code of ['EI', 'SN', 'TF', 'JP']) {
        groups.push({
          code,
          name: names[code],
          rows: this.dimensionStats.filter((row) => row.dimensionCode === code),
        })
      }
      return groups
    },
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
        .catch((error) => this.$modal.msgError(zytjErrorMessage(error)))
      getConfig()
        .then((res) => {
          this.types = (res.data && res.data.types) || []
        })
        .catch((error) => this.$modal.msgError(zytjErrorMessage(error)))
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
        .catch((error) => this.$modal.msgError(zytjErrorMessage(error)))
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
          this.typeStats = data.typeStats || []
          this.dimensionStats = data.dimensionStats || []
          this.departmentStats = data.departmentStats || []
          this.records = data.records || []
          this.total = Number(data.total != null ? data.total : this.records.length)
        })
        .catch((error) => this.$modal.msgError(zytjErrorMessage(error)))
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
          link.download = `职愿探究学生数据_${this.query.schoolId}_${this.query.instanceId}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(link.href)
        })
        .catch((error) => this.$modal.msgError(zytjErrorMessage(error)))
        .finally(() => {
          this.exporting = false
        })
    },
    indexMethod(index) {
      return (this.query.pageNum - 1) * this.query.pageSize + index + 1
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
.analysis-text {
  color: #303133;
  font-size: 14px;
  line-height: 1.8;
}
.analysis-feature {
  margin-left: 10px;
  color: #909399;
  font-size: 13px;
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
.type-code {
  font-weight: 600;
  letter-spacing: 2px;
  color: #5b6cff;
}
.muted {
  color: #909399;
}
.dimension-box {
  padding: 12px 14px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  min-height: 132px;
}
.dimension-title {
  margin-bottom: 10px;
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}
.dimension-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.dimension-letter {
  width: 20px;
  font-weight: 700;
  color: #5b6cff;
  text-align: center;
}
.dimension-item {
  width: 82px;
  color: #606266;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dimension-bar {
  flex: 1;
}
.dimension-count {
  width: 82px;
  color: #909399;
  font-size: 12px;
  text-align: right;
}
.student-card {
  margin-top: 4px;
}
</style>
