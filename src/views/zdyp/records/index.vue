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
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="records" border size="mini">
        <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
        <el-table-column prop="studentName" label="学生" width="100" align="center" />
        <el-table-column prop="studentNo" label="学号" width="130" align="center" />
        <el-table-column prop="schoolName" label="学校" min-width="140" align="center" />
        <el-table-column prop="departmentName" label="院系" min-width="120" align="center" />
        <el-table-column prop="major" label="专业" min-width="110" align="center" />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column prop="careerName" label="岗位" min-width="150" align="center">
          <template slot-scope="scope">{{ scope.row.careerName || '未开始' }}</template>
        </el-table-column>
        <el-table-column label="闯关次数" width="90" align="center">
          <template slot-scope="scope">{{ scope.row.attemptNo || 0 }}</template>
        </el-table-column>
        <el-table-column label="首次即通关" width="100" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.firstAttemptCorrect === '1'" type="success" size="mini">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="累计错误" width="90" align="center">
          <template slot-scope="scope">{{ scope.row.totalWrong || 0 }}</template>
        </el-table-column>
        <el-table-column label="超时次数" width="90" align="center">
          <template slot-scope="scope">{{ scope.row.timeoutCount || 0 }}</template>
        </el-table-column>
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
        <el-table-column label="通关时间" width="155" align="center">
          <template slot-scope="scope">{{ formatDateTime(scope.row.finishTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="openDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" style="color: #f56c6c" @click="remove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="load" />
    </el-card>

    <el-dialog title="参与记录详情" :visible.sync="detailVisible" width="860px" append-to-body>
      <template v-if="detail.record">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="学生">{{ detail.record.studentName }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ detail.record.studentNo }}</el-descriptions-item>
          <el-descriptions-item label="学校">{{ detail.record.schoolName }}</el-descriptions-item>
          <el-descriptions-item label="院系">{{ detail.record.departmentName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ detail.record.major || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ detail.record.gender }}</el-descriptions-item>
          <el-descriptions-item label="岗位">{{ detail.record.careerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="行为分型">{{ detail.record.behaviorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.record.status === 'finished' ? '已通关' : '进行中' }}</el-descriptions-item>
          <el-descriptions-item label="闯关次数">{{ detail.record.attemptNo || 0 }}</el-descriptions-item>
          <el-descriptions-item label="累计错误">{{ detail.record.totalWrong || 0 }}</el-descriptions-item>
          <el-descriptions-item label="超时次数">{{ detail.record.timeoutCount || 0 }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="detail.record.conclusion" class="detail-block">
          <div class="detail-title">个人结论</div>
          <div>{{ detail.record.conclusion }}</div>
        </div>
        <div v-if="detail.record.suggestion" class="detail-block">
          <div class="detail-title">提升建议</div>
          <div>{{ detail.record.suggestion }}</div>
        </div>
      </template>

      <el-divider content-position="left">每次闯关的卡槽放置</el-divider>
      <el-empty v-if="!detail.attempts || !detail.attempts.length" description="暂无闯关记录" />
      <div v-for="attempt in detail.attempts" :key="attempt.attemptNo" class="attempt-block">
        <div class="attempt-head">
          第 {{ attempt.attemptNo }} 次：放对 {{ attempt.correctCount }} / 4，
          用时 {{ (attempt.durationMs / 1000).toFixed(1) }} 秒
          <el-tag v-if="attempt.pass" type="success" size="mini">通关</el-tag>
          <el-tag v-if="attempt.timeout" type="danger" size="mini">超时</el-tag>
        </div>
        <el-table :data="attempt.answers" border size="mini">
          <el-table-column label="卡槽" width="110" align="center">
            <template slot-scope="scope">{{ scope.row.slotName || scope.row.slotCode }}</template>
          </el-table-column>
          <el-table-column label="放置顺序" prop="placeOrder" width="90" align="center" />
          <el-table-column label="放入卡片维度" width="140" align="center">
            <template slot-scope="scope">{{ slotName(scope.row.cardDimension) }}</template>
          </el-table-column>
          <el-table-column label="结果" width="90" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.correct" type="success" size="mini">正确</el-tag>
              <el-tag v-else type="danger" size="mini">错误</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="放置用时" width="120" align="center">
            <template slot-scope="scope">{{ scope.row.elapsedMs == null ? '-' : (scope.row.elapsedMs / 1000).toFixed(1) + ' 秒' }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listRecords, getRecord, deleteRecord, getConfig, zdypErrorMessage } from '@/api/zdyp'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'

export default {
  name: 'ZdypRecords',
  data() {
    return {
      loading: false,
      schools: [],
      departments: [],
      careers: [],
      behaviors: [
        { value: 'balanced', label: '全面均衡型' },
        { value: 'advantage', label: '优势偏好型' },
        { value: 'weak', label: '信息薄弱型' },
        { value: 'rushed', label: '急躁粗放型' }
      ],
      slots: [],
      dateRange: null,
      records: [],
      total: 0,
      detailVisible: false,
      detail: {},
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
          const data = res.data || {}
          this.slots = data.slots || []
          this.careers = (data.careers || []).map((item) => item.career)
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
    slotName(code) {
      const item = this.slots.find((slot) => slot.slotCode === code)
      if (item) return item.slotName
      const fallback = { content: '工作内容', skill: '核心技能', weakness: '职业缺点', prospect: '发展前景' }
      return fallback[code] || (code || '-')
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
      listRecords(this.params())
        .then((res) => {
          this.records = res.rows || []
          this.total = Number(res.total || 0)
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
    openDetail(row) {
      getRecord(row.recordId)
        .then((res) => {
          this.detail = res.data || {}
          this.detailVisible = true
        })
        .catch((error) => this.$modal.msgError(zdypErrorMessage(error)))
    },
    remove(row) {
      this.$modal.confirm('删除后该学生可重新扫码参与，且会同时清理活动参与数据与作答明细，是否继续？')
        .then(() => deleteRecord(row.recordId))
        .then(() => {
          this.$modal.msgSuccess('删除成功')
          if (this.records.length === 1 && this.query.pageNum > 1) {
            this.query.pageNum -= 1
          }
          this.load()
        })
        .catch((error) => {
          if (error !== 'cancel') this.$modal.msgError(zdypErrorMessage(error))
        })
    }
  }
}
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}
.detail-block {
  margin-top: 14px;
  line-height: 1.7;
}
.detail-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.attempt-block {
  margin-bottom: 16px;
}
.attempt-head {
  margin-bottom: 8px;
  font-weight: 600;
}
</style>
