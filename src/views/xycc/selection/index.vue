<!-- 心愿橱窗用户记录：按学生、学校、院系、编码和完成日期筛选，展示所选图案与霍兰德类型。 -->
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
        <el-input v-model.trim="query.major" clearable placeholder="专业名称" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="学号" prop="studentNo">
        <el-input v-model.trim="query.studentNo" clearable placeholder="学号" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select v-model="query.gender" clearable placeholder="全部">
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
          <el-option label="其他/未填" value="其他" />
        </el-select>
      </el-form-item>
      <el-form-item label="编码组合" prop="code">
        <el-input v-model.trim="query.code" clearable placeholder="如 RIA" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="完成时间">
        <el-date-picker v-model="dateRange" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="rows" border stripe size="small">
      <el-table-column type="index" :index="rowIndex" label="#" width="55" align="center" />
      <el-table-column prop="studentName" label="学生" width="110" align="center" />
      <el-table-column prop="studentNo" label="学号" width="130" align="center" />
      <el-table-column prop="schoolName" label="学校" min-width="150" show-overflow-tooltip />
      <el-table-column prop="departmentName" label="院系" min-width="140" show-overflow-tooltip />
      <el-table-column prop="major" label="专业" min-width="120" show-overflow-tooltip />
      <el-table-column prop="gender" label="性别" width="70" align="center" />
      <el-table-column prop="patternComboCode" label="编码" width="80" align="center" />
      <el-table-column prop="patternNames" label="选择图案" min-width="200" show-overflow-tooltip />
      <el-table-column prop="codeSummary" label="霍兰德类型" min-width="160" show-overflow-tooltip />
      <el-table-column prop="careerTitles" label="职业方向" min-width="190" show-overflow-tooltip />
      <el-table-column prop="envTitles" label="工作环境偏好" min-width="150" show-overflow-tooltip />
      <el-table-column label="完成时间" width="155" align="center">
        <template slot-scope="scope">{{ formatTime(scope.row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="getList" />
    <el-empty v-if="!loading && !rows.length" description="暂无用户记录" />
  </div>
</template>

<script>
import { listSelectionRecords } from '@/api/xycc/selection'
import { listSchool } from '@/api/school/school'
import { listDepartment } from '@/api/school/department'
import { listInstances } from '@/api/activity/week'

export default {
  name: 'Selection',
  data() {
    return {
      loading: false,
      total: 0,
      rows: [],
      dateRange: [],
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
    this.getList()
  },
  methods: {
    loadOptions() {
      listSchool({ pageNum: 1, pageSize: 1000 })
        .then(res => {
          this.schools = res.rows || res.data || []
        })
        .catch(() => {})
      listInstances({})
        .then(res => {
          this.activities = res.data || res.rows || []
        })
        .catch(() => {})
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
        .catch(() => {})
    },
    getList() {
      if (this.dateRange && this.dateRange.length === 2) {
        this.query.startDate = this.dateRange[0]
        this.query.endDate = this.dateRange[1]
      } else {
        this.query.startDate = null
        this.query.endDate = null
      }
      if (this.query.startDate && this.query.endDate && this.query.startDate > this.query.endDate) {
        return this.$modal.msgWarning('开始日期不能晚于结束日期')
      }
      this.loading = true
      listSelectionRecords(this.query)
        .then(res => {
          const data = res.data || {}
          this.rows = data.records || []
          this.total = data.total || 0
        })
        .catch(() => this.$modal.msgError('用户记录加载失败，请稍后重试'))
        .finally(() => {
          this.loading = false
        })
    },
    handleQuery() {
      this.query.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
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
      this.getList()
    },
    rowIndex(index) {
      return (this.query.pageNum - 1) * this.query.pageSize + index + 1
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
