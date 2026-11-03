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
      <el-form-item label="结果" prop="result">
        <el-select v-model="query.result" clearable placeholder="全部结果">
          <el-option label="通关" value="win" />
          <el-option label="未通关" value="lose" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="statusFilter">
        <el-select v-model="query.statusFilter" clearable placeholder="全部状态">
          <el-option label="对局中" value="playing" />
          <el-option label="已结束" value="finished" />
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
      <el-table-column prop="studentName" label="学生姓名" width="110" align="center" />
      <el-table-column prop="studentNo" label="学号" width="130" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="150" align="center" />
      <el-table-column prop="departmentName" label="院系" min-width="140" align="center" />
      <el-table-column prop="major" label="专业" min-width="120" align="center" />
      <el-table-column prop="gender" label="性别" width="70" align="center" />
      <el-table-column prop="instanceName" label="活动" min-width="170" align="center" />
      <el-table-column label="第几局" width="80" align="center">
        <template slot-scope="scope">{{ scope.row.attemptNo || 1 }}</template>
      </el-table-column>
      <el-table-column label="结果" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="resultTag(scope.row.result)">{{ scope.row.resultName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="scope">{{ statusText(scope.row.status) }}</template>
      </el-table-column>
      <el-table-column prop="rollCount" label="掷骰次数" width="90" align="center" />
      <el-table-column prop="stepTotal" label="行进步数" width="90" align="center" />
      <el-table-column label="耗时" width="90" align="center">
        <template slot-scope="scope">
          {{ scope.row.durationSeconds == null ? '-' : scope.row.durationSeconds + ' 秒' }}
        </template>
      </el-table-column>
      <el-table-column label="参与时间" width="160" align="center">
        <template slot-scope="scope">{{ formatDateTime(scope.row.scanTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="130" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openDetail(scope.row)">详情</el-button>
          <el-button
            v-hasPermi="['zyfxq:record:remove']"
            type="text"
            size="small"
            class="danger-text"
            @click="remove(scope.row)"
            >删除</el-button
          >
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

    <el-dialog title="参与记录详情" :visible.sync="detailVisible" width="900px" append-to-body>
      <el-descriptions v-if="detail.record" :column="3" border size="small">
        <el-descriptions-item label="学生姓名">{{ detail.record.studentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ detail.record.studentNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detail.record.gender || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学校">{{ detail.record.schoolName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="院系">{{ detail.record.departmentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ detail.record.major || '-' }}</el-descriptions-item>
        <el-descriptions-item label="活动">{{ detail.record.instanceName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="第几局">{{ detail.record.attemptNo || 1 }}</el-descriptions-item>
        <el-descriptions-item label="结果">{{ detail.record.resultName }}</el-descriptions-item>
        <el-descriptions-item label="终点格号">{{ detail.record.position }}</el-descriptions-item>
        <el-descriptions-item label="掷骰次数">{{ detail.record.rollCount }}</el-descriptions-item>
        <el-descriptions-item label="行进步数">{{ detail.record.stepTotal }}</el-descriptions-item>
        <el-descriptions-item label="作答题数">{{ detail.record.answerCount }}</el-descriptions-item>
        <el-descriptions-item label="答对题数">{{ detail.record.correctCount }}</el-descriptions-item>
        <el-descriptions-item label="超时题数">{{ detail.record.timeoutCount }}</el-descriptions-item>
        <el-descriptions-item label="耗时">
          {{ detail.record.durationSeconds == null ? '-' : detail.record.durationSeconds + ' 秒' }}
        </el-descriptions-item>
        <el-descriptions-item label="参与时间">{{ formatDateTime(detail.record.scanTime) }}</el-descriptions-item>
        <el-descriptions-item label="本局结束">{{ formatDateTime(detail.record.endTime) }}</el-descriptions-item>
      </el-descriptions>

      <el-table :data="detail.answers" border stripe size="small" class="detail-table">
        <el-table-column prop="serialNo" label="序号" width="70" align="center" />
        <el-table-column prop="cellNo" label="落点格" width="80" align="center" />
        <el-table-column prop="questionTypeName" label="知识点" width="110" align="center" />
        <el-table-column prop="title" label="题目" min-width="260" show-overflow-tooltip />
        <el-table-column label="学生选择" min-width="180" show-overflow-tooltip>
          <template slot-scope="scope">{{ scope.row.optionContent || '超时未作答' }}</template>
        </el-table-column>
        <el-table-column label="正确答案" min-width="180" show-overflow-tooltip>
          <template slot-scope="scope">{{ scope.row.correctContent }}</template>
        </el-table-column>
        <el-table-column label="结果" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.resultName === '答对' ? 'success' : 'danger'">
              {{ scope.row.resultName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="限时" width="80" align="center">
          <template slot-scope="scope">{{ scope.row.limitSeconds }} 秒</template>
        </el-table-column>
        <el-table-column label="实际用时" width="100" align="center">
          <template slot-scope="scope">{{ costText(scope.row.costMs) }}</template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button @click="detailVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listRecords, getRecord, deleteRecord, zyfxqErrorMessage } from '@/api/zyfxq'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'ZyfxqRecords',
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
      detail: { record: null, answers: [] },
      query: {
        pageNum: 1,
        pageSize: 10,
        schoolId: null,
        instanceId: null,
        departmentId: null,
        major: null,
        studentNo: null,
        gender: null,
        result: null,
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
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
      listInstances({})
        .then((res) => {
          this.activities = res.data || res.rows || []
        })
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
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
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
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
      listRecords(this.params())
        .then((res) => {
          this.records = res.rows || []
          this.total = Number(res.total || 0)
        })
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
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
    openDetail(row) {
      getRecord(row.recordId)
        .then((res) => {
          const data = res.data || {}
          this.detail = { record: data.record || row, answers: data.answers || [] }
          this.detailVisible = true
        })
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
    },
    remove(row) {
      this.$modal
        .confirm(
          '删除「' + (row.studentName || '该学生') + '」的参与记录？会同时清理答题明细和活动游戏参与数据，删除后学生可重新扫码参与。',
        )
        .then(() => deleteRecord(row.recordId))
        .then(() => {
          this.$modal.msgSuccess('已删除')
          if (this.records.length === 1 && this.query.pageNum > 1) {
            this.query.pageNum -= 1
          }
          this.load()
        })
        .catch((error) => {
          if (error !== 'cancel') this.$modal.msgError(zyfxqErrorMessage(error))
        })
    },
    statusText(status) {
      if (status === 'ready') return '未开始'
      if (status === 'playing') return '对局中'
      return '已结束'
    },
    resultTag(result) {
      if (result === 'win') return 'success'
      if (result === 'lose') return 'danger'
      return 'info'
    },
    costText(costMs) {
      if (costMs == null) return '-'
      return (Math.round(costMs / 100) / 10).toFixed(1) + ' 秒'
    },
    formatDateTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      const pad = (n) => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
        date.getHours(),
      )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },
  },
}
</script>

<style scoped>
.detail-table {
  margin-top: 16px;
}
.danger-text {
  color: #f56c6c;
}
</style>
