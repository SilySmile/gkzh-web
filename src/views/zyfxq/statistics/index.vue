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
        <el-button
          v-hasPermi="['zyfxq:statistics:export']"
          type="success"
          icon="el-icon-download"
          :loading="exporting"
          @click="exportExcel"
          >下载 Excel</el-button
        >
      </el-form-item>
    </el-form>

    <el-alert
      title="页面内容与需求文档的“结果输出-学校端”一致：第一页为参与总人数、平均单局耗时、累计掷骰次数和整体通过人数；第二页为各知识点正确率、超时答题占比、各题目正确率、每题平均作答用时和高频错题。统计与列表使用同一组筛选条件。"
      type="info"
      :closable="false"
      class="tip"
    />

    <div class="section-title">第一页 · 整体参与情况</div>
    <el-row :gutter="16" class="summary-row">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">参与总人数</div>
          <div class="metric-value">{{ summary.participantCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="pass-card">
          <div class="metric-label">整体通过人数</div>
          <div class="metric-value">{{ summary.winCount || 0 }}</div>
          <div class="metric-sub">通过率 {{ summary.passRate || 0 }}%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">参与者平均单局耗时</div>
          <div class="metric-value">{{ summary.avgDurationSeconds || 0 }}<span class="unit">秒</span></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">全员累计掷骰总次数</div>
          <div class="metric-value">{{ summary.rollTotal || 0 }}<span class="unit">次</span></div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16" class="summary-row">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">累计行进总步数</div>
          <div class="metric-value">{{ summary.stepTotal || 0 }}<span class="unit">步</span></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">未通关人数</div>
          <div class="metric-value">{{ summary.loseCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">整体答题正确率</div>
          <div class="metric-value">{{ summary.correctRate || 0 }}<span class="unit">%</span></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">超时答题占比</div>
          <div class="metric-value">{{ summary.timeoutRate || 0 }}<span class="unit">%</span></div>
        </el-card>
      </el-col>
    </el-row>

    <div class="section-title">第二页 · 知识点与题目正确率</div>
    <el-table :data="questionTypeStats" border stripe size="small" class="block">
      <el-table-column prop="serialNo" label="序号" width="70" align="center" />
      <el-table-column prop="questionTypeName" label="知识点" width="140" align="center" />
      <el-table-column prop="answerCount" label="作答次数" width="110" align="center" />
      <el-table-column prop="correctCount" label="答对次数" width="110" align="center" />
      <el-table-column label="正确率" width="120" align="center">
        <template slot-scope="scope">
          <el-tag :type="rateTag(scope.row.correctRate)">{{ scope.row.correctRate }}%</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="timeoutCount" label="超时次数" width="110" align="center" />
      <el-table-column label="超时占比" width="120" align="center">
        <template slot-scope="scope">{{ scope.row.timeoutRate }}%</template>
      </el-table-column>
      <el-table-column label="每题平均作答用时" min-width="150" align="center">
        <template slot-scope="scope">{{ scope.row.avgCostSeconds }} 秒</template>
      </el-table-column>
    </el-table>

    <el-table :data="questionStats" border stripe size="small" class="block" max-height="420">
      <el-table-column prop="serialNo" label="序号" width="70" align="center" />
      <el-table-column prop="questionTypeName" label="知识点" width="120" align="center" />
      <el-table-column prop="title" label="题目" min-width="340" show-overflow-tooltip />
      <el-table-column prop="answerCount" label="作答次数" width="100" align="center" />
      <el-table-column prop="correctCount" label="答对" width="80" align="center" />
      <el-table-column prop="wrongCount" label="答错" width="80" align="center" />
      <el-table-column label="正确率" width="110" align="center">
        <template slot-scope="scope">
          <el-tag :type="rateTag(scope.row.correctRate)">{{ scope.row.correctRate }}%</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="平均作答用时" width="130" align="center">
        <template slot-scope="scope">{{ scope.row.avgCostSeconds }} 秒</template>
      </el-table-column>
      <el-table-column label="超时" width="80" align="center">
        <template slot-scope="scope">{{ scope.row.timeoutCount }}</template>
      </el-table-column>
    </el-table>

    <div class="analysis-row">
      <el-card shadow="never" class="analysis-card">
        <div slot="header" class="analysis-header">高频错题统计</div>
        <el-empty v-if="!wrongQuestions.length" description="当前没有答错记录" :image-size="60" />
        <ol v-else class="wrong-list">
          <li v-for="item in wrongQuestions" :key="item.questionId">
            <span class="wrong-title">{{ item.title }}</span>
            <span class="wrong-meta">
              答错 {{ item.wrongCount }} 次 · 正确率 {{ item.correctRate }}% · 平均 {{ item.avgCostSeconds }} 秒
            </span>
          </li>
        </ol>
      </el-card>
      <el-card shadow="never" class="analysis-card">
        <div slot="header" class="analysis-header">整体分析</div>
        <p class="analysis-text">{{ analysis || '暂无数据' }}</p>
      </el-card>
    </div>

    <div class="section-title">学生明细</div>
    <el-table v-loading="loading" :data="records" border stripe>
      <el-table-column prop="studentName" label="学生姓名" width="110" align="center" />
      <el-table-column prop="studentNo" label="学号" width="130" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="150" align="center" />
      <el-table-column prop="departmentName" label="院系" min-width="140" align="center" />
      <el-table-column prop="major" label="专业" min-width="120" align="center" />
      <el-table-column prop="gender" label="性别" width="70" align="center" />
      <el-table-column label="结果" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.result === 'win' ? 'success' : scope.row.result === 'lose' ? 'danger' : 'info'">
            {{ scope.row.resultName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rollCount" label="掷骰次数" width="90" align="center" />
      <el-table-column prop="stepTotal" label="行进步数" width="90" align="center" />
      <el-table-column prop="answerCount" label="作答题数" width="90" align="center" />
      <el-table-column prop="correctCount" label="答对题数" width="90" align="center" />
      <el-table-column label="耗时" width="90" align="center">
        <template slot-scope="scope">
          {{ scope.row.durationSeconds == null ? '-' : scope.row.durationSeconds + ' 秒' }}
        </template>
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
    <el-empty v-if="!loading && !records.length" description="暂无符合条件的统计数据" />
  </div>
</template>

<script>
import { getStatistics, exportStatisticsExcel, zyfxqErrorMessage } from '@/api/zyfxq'
import { saveAs } from 'file-saver'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'ZyfxqStatistics',
  data() {
    return {
      loading: false,
      exporting: false,
      records: [],
      total: 0,
      summary: {},
      questionTypeStats: [],
      questionStats: [],
      wrongQuestions: [],
      analysis: '',
      schools: [],
      departments: [],
      activities: [],
      dateRange: null,
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
      getStatistics(this.params())
        .then((res) => {
          const data = res.data || {}
          this.summary = data.summary || {}
          this.questionTypeStats = data.questionTypeStats || []
          this.questionStats = data.questionStats || []
          this.wrongQuestions = data.wrongQuestions || []
          this.analysis = data.analysis || ''
          this.records = data.records || []
          this.total = Number(data.total != null ? data.total : this.records.length)
        })
        .catch((error) => this.$modal.msgError(zyfxqErrorMessage(error)))
        .finally(() => {
          this.loading = false
        })
    },
    async exportExcel() {
      if (!this.query.schoolId || !this.query.instanceId) {
        this.$modal.msgWarning('请先选择学校和活动')
        return
      }
      this.exporting = true
      try {
        const params = this.params()
        delete params.pageNum
        delete params.pageSize
        const blob = await exportStatisticsExcel(params)
        saveAs(blob, `职业飞行棋学生数据_${this.query.schoolId}_${this.query.instanceId}.xlsx`)
      } catch (error) {
        this.$modal.msgError(zyfxqErrorMessage(error))
      } finally {
        this.exporting = false
      }
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
    rateTag(rate) {
      const value = Number(rate)
      if (value >= 80) return 'success'
      if (value >= 60) return 'warning'
      return 'danger'
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
.tip {
  margin-bottom: 16px;
}
.section-title {
  margin: 8px 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-left: 4px solid #1677ff;
  padding-left: 10px;
}
.summary-row {
  margin-bottom: 16px;
}
.metric-label {
  color: #909399;
  font-size: 13px;
}
.metric-value {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 600;
  color: #303133;
}
.metric-value .unit {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 400;
  color: #909399;
}
.metric-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #67c23a;
}
.pass-card {
  border-left: 4px solid #67c23a;
}
.block {
  margin-bottom: 16px;
}
.analysis-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.analysis-card {
  flex: 1;
}
.analysis-header {
  font-weight: 600;
  color: #303133;
}
.wrong-list {
  margin: 0;
  padding-left: 20px;
  line-height: 1.9;
}
.wrong-title {
  color: #303133;
}
.wrong-meta {
  margin-left: 8px;
  color: #f56c6c;
  font-size: 12px;
}
.analysis-text {
  margin: 0;
  line-height: 1.8;
  color: #606266;
}
</style>
