<template>
  <div class="app-container">
    <el-card class="filter-card">
      <el-form ref="queryForm" :model="query" :inline="true" size="small" label-width="80px">
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
            <el-option v-for="item in departments" :key="item.departmentId" :label="item.name || item.title" :value="item.departmentId" />
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
        <el-form-item label="岗位" prop="careerCode">
          <el-select v-model="query.careerCode" clearable filterable placeholder="全部岗位">
            <el-option v-for="item in careers" :key="item.careerCode" :label="item.careerName" :value="item.careerCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="行为分型" prop="behaviorType">
          <el-select v-model="query.behaviorType" clearable placeholder="全部分型">
            <el-option v-for="item in behaviors" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="statusFilter">
          <el-select v-model="query.statusFilter" clearable placeholder="全部状态">
            <el-option label="进行中" value="inProgress" />
            <el-option label="已通关" value="finished" />
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
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="search">查询</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="reset">重置</el-button>
          <el-button type="success" icon="el-icon-download" size="small" :loading="exporting" @click="exportExcel">导出 Excel</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="12" class="metric-row">
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">参与人数</div><div class="metric-value">{{ summary.participantCount || 0 }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">通关人数</div><div class="metric-value">{{ summary.finishedCount || 0 }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">通关率</div><div class="metric-value">{{ summary.finishRate || 0 }}%</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">首次即通关率</div><div class="metric-value">{{ summary.firstPassRate || 0 }}%</div></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="metric-row">
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">平均闯关次数</div><div class="metric-value">{{ summary.avgAttempts || 0 }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">平均首次用时</div><div class="metric-value">{{ summary.avgFirstSeconds || 0 }} 秒</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">平均最快通关用时</div><div class="metric-value">{{ summary.avgBestSeconds || 0 }} 秒</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">超时人数占比</div><div class="metric-value">{{ summary.timeoutRate || 0 }}%</div></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :span="12">
        <el-card>
          <div slot="header">四类职业认知分型</div>
          <el-table :data="behaviorStats" border size="mini">
            <el-table-column prop="behaviorName" label="行为分型" min-width="120" align="center" />
            <el-table-column prop="playerCount" label="人数" width="80" align="center" />
            <el-table-column label="占比" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.rate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div slot="header">首次尝试各维度错误</div>
          <el-table :data="slotStats" border size="mini">
            <el-table-column prop="slotName" label="卡槽" min-width="100" align="center" />
            <el-table-column prop="correctCount" label="放对" width="70" align="center" />
            <el-table-column prop="wrongCount" label="放错" width="70" align="center" />
            <el-table-column label="首次正确率" width="100" align="center">
              <template slot-scope="scope">{{ scope.row.correctRate }}%</template>
            </el-table-column>
            <el-table-column prop="unfilledCount" label="未填写" width="80" align="center" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="metric-row">
      <el-col :span="12">
        <el-card>
          <div slot="header">首填卡槽偏好</div>
          <el-table :data="firstSlotStats" border size="mini">
            <el-table-column prop="slotName" label="首选卡槽" min-width="120" align="center" />
            <el-table-column prop="playerCount" label="人数" width="80" align="center" />
            <el-table-column label="占比" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.rate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div slot="header">岗位选择分布</div>
          <el-table :data="careerStats" border size="mini" max-height="300">
            <el-table-column prop="careerName" label="岗位" min-width="170" align="center" />
            <el-table-column prop="selectedCount" label="选择人数" width="90" align="center" />
            <el-table-column prop="finishedCount" label="通关人数" width="90" align="center" />
            <el-table-column label="通关率" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.finishRate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="metric-row">
      <div slot="header">简要分析</div>
      <div class="analysis">{{ analysis || '暂无数据' }}</div>
    </el-card>

    <el-card>
      <div slot="header">学生明细</div>
      <el-table v-loading="loading" :data="records" border size="mini">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="studentName" label="学生" width="100" align="center" />
        <el-table-column prop="studentNo" label="学号" width="130" align="center" />
        <el-table-column prop="departmentName" label="院系" min-width="120" align="center" />
        <el-table-column prop="major" label="专业" min-width="110" align="center" />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column prop="careerName" label="岗位" min-width="150" align="center" />
        <el-table-column prop="attemptNo" label="闯关次数" width="90" align="center" />
        <el-table-column prop="totalWrong" label="累计错误" width="90" align="center" />
        <el-table-column prop="timeoutCount" label="超时次数" width="90" align="center" />
        <el-table-column prop="behaviorName" label="行为分型" width="120" align="center">
          <template slot-scope="scope">{{ scope.row.behaviorName || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === 'finished'" type="success" size="mini">已通关</el-tag>
            <el-tag v-else type="info" size="mini">进行中</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参与时间" width="155" align="center">
          <template slot-scope="scope">{{ formatDateTime(scope.row.scanTime) }}</template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="load" />
    </el-card>
  </div>
</template>

<script>
import { getStatistics, getConfig, exportStatisticsExcel, zdypErrorMessage } from '@/api/zdyp'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'

export default {
  name: 'ZdypStatistics',
  data() {
    return {
      loading: false,
      exporting: false,
      schools: [],
      departments: [],
      careers: [],
      behaviors: [
        { value: 'balanced', label: '全面均衡型' },
        { value: 'advantage', label: '优势偏好型' },
        { value: 'weak', label: '信息薄弱型' },
        { value: 'rushed', label: '急躁粗放型' }
      ],
      dateRange: null,
      summary: {},
      behaviorStats: [],
      slotStats: [],
      firstSlotStats: [],
      careerStats: [],
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
        careerCode: null,
        behaviorType: null,
        statusFilter: null
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
        .then((res) => {
          this.schools = res.rows || res.data || []
        })
        .catch((error) => this.$modal.msgError(zdypErrorMessage(error)))
      getConfig()
        .then((res) => {
          this.careers = ((res.data || {}).careers || []).map((item) => item.career)
        })
        .catch((error) => this.$modal.msgError(zdypErrorMessage(error)))
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
        .catch((error) => this.$modal.msgError(zdypErrorMessage(error)))
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
          this.behaviorStats = data.behaviorStats || []
          this.slotStats = data.slotStats || []
          this.firstSlotStats = data.firstSlotStats || []
          this.careerStats = data.careerStats || []
          this.analysis = data.analysis || ''
          this.records = data.records || []
          this.total = Number(data.total != null ? data.total : this.records.length)
        })
        .catch((error) => this.$modal.msgError(zdypErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    search() {
      this.query.pageNum = 1
      this.load()
    },
    reset() {
      this.dateRange = null
      this.query = {
        pageNum: 1,
        pageSize: this.query.pageSize,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        careerCode: null,
        behaviorType: null,
        statusFilter: null
      }
      this.departments = []
      this.load()
    },
    indexMethod(index) {
      return (this.query.pageNum - 1) * this.query.pageSize + index + 1
    },
    formatDateTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      const pad = (num) => (num < 10 ? '0' + num : String(num))
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
        + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
    },
    exportExcel() {
      if (!this.query.schoolId || !this.query.instanceId) {
        this.$modal.msgWarning('请先选择学校和活动')
        return
      }
      if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] > this.dateRange[1]) {
        this.$modal.msgWarning('开始日期不能晚于结束日期')
        return
      }
      this.exporting = true
      exportStatisticsExcel(this.params())
        .then((blob) => {
          const link = document.createElement('a')
          link.href = window.URL.createObjectURL(blob)
          link.download = '职得一拼学生数据_' + this.query.schoolId + '_' + this.query.instanceId + '.xlsx'
          link.click()
          window.URL.revokeObjectURL(link.href)
        })
        .catch((error) => this.$modal.msgError(zdypErrorMessage(error)))
        .finally(() => {
          this.exporting = false
        })
    }
  }
}
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}
.metric-row {
  margin-bottom: 12px;
}
.metric-label {
  color: #909399;
  font-size: 13px;
}
.metric-value {
  font-size: 22px;
  font-weight: 600;
  margin-top: 6px;
}
.analysis {
  line-height: 1.8;
  color: #303133;
}
</style>
