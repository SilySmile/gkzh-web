<template>
  <div class="app-container">
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
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="records" border stripe>
      <el-table-column prop="recordId" label="记录 ID" width="90" align="center" />
      <el-table-column prop="studentName" label="学生姓名" width="110" align="center" />
      <el-table-column prop="studentNo" label="学号" width="130" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="150" align="center" />
      <el-table-column prop="departmentName" label="院系" min-width="140" align="center" />
      <el-table-column prop="major" label="专业" min-width="120" align="center" />
      <el-table-column prop="gender" label="性别" width="70" align="center" />
      <el-table-column prop="instanceName" label="活动" min-width="170" align="center" />
      <el-table-column label="总重量" width="90" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.status === 'finished'">{{ scope.row.totalWeight }}g</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="结果" width="90" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status !== 'finished'" type="info">进行中</el-tag>
          <el-tag v-else-if="scope.row.result === 'pass'" type="success">通关</el-tag>
          <el-tag v-else type="danger">未通关</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="selectedCount" label="勾选数" width="80" align="center" />
      <el-table-column prop="attemptNo" label="称重次数" width="90" align="center" />
      <el-table-column label="用时" width="90" align="center">
        <template slot-scope="scope">{{ seconds(scope.row.durationMs) }}</template>
      </el-table-column>
      <el-table-column label="参与时间" width="160" align="center">
        <template slot-scope="scope">{{ formatDateTime(scope.row.scanTime) }}</template>
      </el-table-column>
      <el-table-column label="提交时间" width="160" align="center">
        <template slot-scope="scope">{{ formatDateTime(scope.row.finishTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="detail(scope.row)">详情</el-button>
          <el-button type="text" size="small" class="danger-text" @click="remove(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="query.pageNum"
      :limit.sync="query.pageSize"
      @pagination="load"
    />
    <el-empty v-if="!loading && !records.length" description="暂无符合条件的参与记录" />

    <el-dialog title="称重详情" :visible.sync="detailVisible" width="760px">
      <template v-if="detailRecord">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="学生">{{ detailRecord.studentName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ detailRecord.studentNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学校">{{ detailRecord.schoolName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="院系">{{ detailRecord.departmentName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ detailRecord.major || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ detailRecord.gender || '-' }}</el-descriptions-item>
          <el-descriptions-item label="总重量">{{ totalText(detailRecord) }}</el-descriptions-item>
          <el-descriptions-item label="结果">{{ resultText(detailRecord) }}</el-descriptions-item>
          <el-descriptions-item label="称重次数">第 {{ detailRecord.attemptNo || 1 }} 次</el-descriptions-item>
          <el-descriptions-item label="用时">{{ seconds(detailRecord.durationMs) }}</el-descriptions-item>
          <el-descriptions-item label="参与时间">{{ formatDateTime(detailRecord.scanTime) }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDateTime(detailRecord.finishTime) }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-title">本次勾选的砝码</div>
        <el-table :data="choices" border size="mini">
          <el-table-column prop="weightNo" label="挂钩号" width="80" align="center" />
          <el-table-column prop="weightLabel" label="砝码" min-width="160" />
          <el-table-column label="类别" min-width="180">
            <template slot-scope="scope">{{ categoryName(scope.row.categoryCode) }}</template>
          </el-table-column>
          <el-table-column prop="weightG" label="重量" width="90" align="center">
            <template slot-scope="scope">{{ scope.row.weightG }}g</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!choices.length" description="本次没有勾选砝码" :image-size="60" />
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { listRecords, getRecord, deleteRecord, jlczErrorMessage } from '@/api/jlcz'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'JlczRecords',
  data() {
    return {
      loading: false,
      records: [],
      total: 0,
      schools: [],
      departments: [],
      activities: [],
      dateRange: null,
      detailVisible: false,
      detailRecord: null,
      choices: [],
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
    load() {
      this.loading = true
      const params = { ...this.query }
      if (this.dateRange && this.dateRange.length === 2) {
        params.startDate = this.dateRange[0]
        params.endDate = this.dateRange[1]
      }
      listRecords(params)
        .then((res) => {
          this.records = res.rows || res.data || []
          this.total = Number(res.total != null ? res.total : this.records.length)
        })
        .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    detail(row) {
      getRecord(row.recordId)
        .then((res) => {
          const data = res.data || {}
          this.detailRecord = data.record || null
          this.choices = data.choices || []
          this.detailVisible = true
        })
        .catch((error) => this.$modal.msgError(jlczErrorMessage(error)))
    },
    remove(row) {
      this.$modal
        .confirm('确认删除该条参与记录吗？将同时删除砝码明细和活动游戏参与数据，删除后可重新扫码参与，便于测试。')
        .then(() => deleteRecord(row.recordId))
        .then(() => {
          this.$modal.msgSuccess('记录已删除')
          if (this.records.length === 1 && this.query.pageNum > 1) {
            this.query.pageNum -= 1
          }
          this.load()
        })
        .catch((error) => {
          if (error) this.$modal.msgError(jlczErrorMessage(error))
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
    totalText(row) {
      return row.status === 'finished' ? `${row.totalWeight}g` : '-'
    },
    resultText(row) {
      if (row.status !== 'finished') return '进行中'
      return row.result === 'pass' ? '通关' : '未通关'
    },
    categoryName(code) {
      const map = {
        core: '硬通货（核心竞争力）',
        soft: '软实力（发展潜力）',
        basic: '基本功（职业素养）',
        bonus: '加分项（额外亮点）',
      }
      return map[code] || code || '-'
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
.danger-text {
  color: #f56c6c;
}
.detail-title {
  margin: 18px 0 10px;
  font-weight: 600;
}
/deep/ .el-table th {
  background: #f5f7fa;
}
</style>
